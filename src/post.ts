import express, { Request, Response } from 'express';
import { Post } from '../models/Post';
import MongoClient from 'mongodb';
import { ObjectId } from 'mongodb';

const post = express();

const url = 'mongodb://127.0.0.1:27017/';
MongoClient.connect(url, function (err, client) {
  if (err) throw err;
  const db = client.db('notepad');
  const postCollection = db.collection('posts');

  post.get('/', (req: Request, res: Response) => {
    postCollection.countDocuments((err, pageCount) => {
      if (err) return res.status(400).send({ error: 'database failure' });
      res.json(Math.floor(pageCount / 6) + 1);
    });
  });

  post.get('/:page', (req: Request, res: Response) => {
    const skip = (parseInt(req.params.page) - 1) * 5;
    postCollection
      .find()
      .skip(skip)
      .limit(5)
      .toArray(function (err, posts) {
        if (err) return res.status(400).send({ error: 'database failure' });
        if (req.session.isLogedIn) {
          res.json({
            posts,
            isLogedIn: true,
          });
        } else {
          res.json({
            posts,
            isLogedIn: false,
          });
        }
      });
  });

  post.post('/create', (req: Request, res: Response) => {
    try {
      const post: Post = {
        user: {
          id: req.session.userId,
          password: req.session.password,
        },
        title: req.body.title,
        body: req.body.body,
      };

      postCollection.insertOne(post, (err) => {
        if (err) return res.status(400).send({ success: false, err });
        return res.json({
          success: true,
          msg: '글 생성 성공.',
        });
      });
    } catch (err) {
      return res.status(400).send({
        err,
      });
    }
  });

  post.get('/read/:_id', (req: Request, res: Response) => {
    postCollection.findOne(
      { _id: new ObjectId(req.params._id) },
      function (err, post) {
        if (err) return res.status(400).send({ error: 'database failure' });
        if (post.user.id === req.session.userId) {
          res.json({
            post,
            isUser: true,
          });
        } else {
          res.json({
            post,
            isUser: false,
          });
        }
      }
    );
  });

  post.put('/read/:_id', function (req, res) {
    postCollection.findOne(
      { _id: new ObjectId(req.params._id) },
      function (err, post) {
        if (err) return res.status(400).json({ error: 'database failure' });
        if (!post) return res.status(404).json({ error: 'post not found' });

        if (req.body.title) post.title = req.body.title;
        if (req.body.body) post.body = req.body.body;

        postCollection.updateOne(
          { _id: new ObjectId(req.params._id) },
          { $set: post },
          function (err) {
            if (err) res.status(400).json({ error: 'failed to update' });
            res.json({ success: true, msg: '수정에 성공하였습니다.' });
          }
        );
      }
    );
  });

  post.delete('/read/:_id', function (req, res) {
    postCollection.deleteOne(
      { _id: new ObjectId(req.params._id) },
      function (err) {
        if (err) return res.status(400).json({ error: 'database failure' });
        res.json({
          success: true,
          msg: '삭제 성공하였습니다.',
        });
      }
    );
  });
});

export { post };
