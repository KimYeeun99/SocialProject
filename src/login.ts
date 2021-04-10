import express, { Request, Response } from 'express';
import { User } from '../models/User';
import argon2 from 'argon2';
import MongoClient from 'mongodb';

const login = express();

const url = 'mongodb://127.0.0.1:27017/';
MongoClient.connect(url, function (err, client) {
  if (err) throw err;
  const db = client.db('notepad');
  const userCollection = db.collection('users');

  login.get('/', (req: Request, res: Response) => {
    if (!req.session.isLogedIn) {
      req.session.isLogedIn = false;
    }
    const userId = req.session.userId;
    const isLogedIn = req.session.isLogedIn;
    res.json({
      userId,
      isLogedIn,
    });
  });

  login.post('/', async (req: Request, res: Response) => {
    try {
      userCollection.findOne({ id: req.body.id }, async (err, user) => {
        if (err) return res.status(400).json({ success: false, err });
        if (!user) {
          res.json({
            success: false,
            msg: '아이디가 존재하지 않습니다.',
          });
        } else {
          if (await argon2.verify(user.password, req.body.password)) {
            req.session.userId = req.body.id;
            req.session.password = req.body.password;
            req.session.isLogedIn = true;
            res.json({
              success: true,
              msg: '로그인 성공',
            });
          } else {
            // password did not match
            res.json({
              success: false,
              msg: '비밀번호가 다릅니다.',
            });
          }
        }
      });
    } catch (err) {
      // internal failure
      res.status(400).json({ success: false, err });
    }
  });

  login.post('/register', async (req: Request, res: Response) => {
    try {
      const hash = await argon2.hash(req.body.password);
      const user: User = {
        id: req.body.id,
        password: hash,
      };

      userCollection.findOne({ id: req.body.id }, (err, findUser) => {
        if (err) return res.json({ success: false, err });
        if (!findUser) {
          userCollection.insertOne(user, (err) => {
            if (err) return res.status(400).json({ success: false, err });
            return res.json({
              success: true,
              msg: '가입 성공.',
            });
          });
        } else {
          return res.status(400).json({
            success: false,
            msg: '이미 존재하는 아이디입니다',
          });
        }
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        err,
        msg: '가입실패',
      });
    }
  });
});

export { login };
