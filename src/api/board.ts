import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";
import reply from "./reply";

export const boardScheme = yup.object({
  title: yup.string().required(),
  body: yup.string().required(),
});

async function insertBoard(req: Request, res: Response) {
  try{
    const {
      title,
      body
    } = boardScheme.validateSync(req.body);

    const user_id = req.session.userId;

    const rows = await db(
      "INSERT INTO board (title, body, user_id) values (?, ?, ?)", [title, body, user_id]
    )
    res.send({
      success: true,
      msg: '글 생성 성공'
    });
  } catch(error){
    return res.status(400).send({
      success: false,
      msg: '글 생성 실패'
    })
    
  }
}

async function searchBoard(req: Request, res: Response){
  try{
    const title = req.query.title;
    const rows = await db("SELECT * FROM board WHERE title like ? ORDER BY regdate desc", ['%'+title+'%']);
    res.json(rows);
  } catch(error){
    res.status(400).send({
      success: false,
      msg: '검색 실패'
    })
  }

}

async function readAllBoard(req: Request, res: Response) {
  try{
    const rows = await db('SELECT * FROM board ORDER BY regdate desc', '');
    res.json(rows);
  } catch(error){
    res.status(400).send({
      success: false,
      msg: '조회 실패'
    })
  }  
}

async function readOneBoard(req:Request, res: Response) {
  try{
    const board_id = req.params.id;
    const rows = await db('SELECT * FROM board WHERE board_id=?', [board_id]);

    if(req.session.isLogedIn){
      res.json({
        rows,
        isLogedIn: true
      });
    } else{
      res.json({
        rows,
        isLogedIn: false
      });
    }
    
  } catch(error){
    res.status(400).send({
      success: false,
      msg: '조회 실패'
    });
  }
}

async function updateBoard(req:Request, res: Response) {
  try{
    const board_id = Number(req.params.id);
    const {
      title,
      body
    } = boardScheme.validateSync(req.body);
    const check = await db('SELECT user_id FROM board WHERE board_id=? AND user_id=?', [board_id, req.session.userId]);

    if(!check[0])
    return res.json({success: false, msg: '사용자가 일치하지 않습니다.'});

    const rows = await db('UPDATE board SET title=?, body=? WHERE board_id=?', [title, body, board_id]);
    res.json({
      success: true,
      msg: '글 수정 성공'
    });
  } catch(error){
    res.status(400).send({
      success: false,
      msg: '글 수정 실패'
    })
  }
}

async function deleteBoard(req:Request, res: Response) {
  try{
    const board_id = req.params.id;
    const check = await db('SELECT user_id FROM board WHERE board_id=? AND user_id=?', [board_id, req.session.userId]);

    if(!check[0]) return res.json({success: false, msg: '사용자가 일치하지 않습니다.'});

    const rows = await db('DELETE FROM board WHERE board_id=?', [board_id]);
    res.json({
      success: true,
      msg: '글 삭제 성공'
    });
  } catch(error){
    res.json({
      success: false,
      msg: '글 삭제 실패'
    })
  }
}

function loginCheck(req: Request, res: Response, next: NextFunction){
  if(req.session.isLogedIn){
    next();
  } else{
    return res.json({
      success: false,
      msg: '로그인이 필요합니다'
    })
  }
}

const router = Router();

router.post('/', loginCheck, insertBoard);
router.get('/search', searchBoard);
router.get('/', readAllBoard);
router.get('/:id', readOneBoard);
router.put('/:id', loginCheck, updateBoard);
router.delete('/:id', loginCheck, deleteBoard);

router.use('/:id/reply', (req: Request, res: Response, next: NextFunction) => {
  req.body.boardId = req.params.id;
  next();
}, reply);

export default router;