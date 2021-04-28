import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";

const limit = 10;


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
      "INSERT INTO board (title, body, user_id, good) values (?, ?, ?, ?)", [title, body, user_id, 0]
    )
    res.send({
      success: true,
      msg: '글 생성 성공'
    });
  } catch(error){
    res.status(400).send({
      success: false,
      msg: '글 생성 실패'
    })
    
  }
}

async function searchBoard(req: Request, res: Response){
  try{
    const title = req.query.title;
    const offset = 0; // body에서 받아오기
    const rows = await db(`select * from board where like ? order by regdate desc limit ? offset ?`,
     ['%'+title+'%', limit, offset]);
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
    const offset = 0; // body에서 받아오기
    const rows = await db(`select * from board order by regdate desc limit ? offset ?`, [limit, offset]);
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
    const rows = await db(`select * from board WHERE board_id=?`, [board_id]);

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
    const check = await db('SELECT user_id FROM board WHERE board_id=? AND user_id=?',
     [board_id, req.session.userId]);

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
    const check = await db('SELECT user_id FROM board WHERE board_id=? AND user_id=?',
     [board_id, req.session.userId]);

    if(!check[0]) return res.json({success: false, msg: '사용자가 일치하지 않습니다.'});

    const rows = await db('DELETE FROM board WHERE board_id=?', [board_id]);
    res.json({
      success: true,
      msg: '글 삭제 성공'
    });
  } catch(error){
    res.status(400).send({
      success: false,
      msg: '글 삭제 실패'
    })
  }
}

async function scrapBoard(req: Request, res: Response){
  try{
    const boardId = req.params.id;
    const userId = req.session.userId;

    const check = await db('SELECT scrap_id FROM scrap WHERE board_id=? AND user_id=?', [boardId, userId]);

    if(check[0]){
      await db('DELETE FROM scrap WHERE scrap_id=?', [check[0].scrap_id]);
      res.json({
        success: true,
        msg: '스크랩 삭제 성공'
      })
    } else{
      await db('INSERT INTO scrap (board_id, user_id) VALUES (?, ?)', [boardId, userId]);
      res.json({
        success: true,
        msg: '스크랩 성공'
      })
    }
    
  } catch(error){
    res.status(400).send({
      success: false,
      msg : '스크랩 실패'
    })
  } 
}

async function readScrapBoard(req:Request, res: Response) {
  try{
    const userId = req.session.userId;

    const rows = await db(`select board.* from scrap inner join board on board.board_id=scrap.board_id where scrap.user_id=? order by regdate desc`,
     [userId]);

    res.json(rows);

  } catch(error){
    res.status(400).send({
      success: false,
      msg: '스크랩 조회 실패'
    })
  }
}

async function scrapCount(req: Request, res: Response){
  try{
    const boardId = req.params.id;
    const rows = await db('select count(scrap_id) as scrapcount from scrap where board_id=?', [boardId]);

    if(rows[0]){
      res.json(rows);
    } else{
      res.json({
        scrapcount : 0
      })
    }
  } catch(error){
    res.status(400).send({
      success: false
    })
  }
}

async function goodCount(req: Request, res: Response){
  try{
      const boardId = req.params.id;
      const rows = await db('select count(board_id) as goodcount from boardgood where board_id=? group by board_id', [boardId]);
      
      if(rows[0])
          res.json(rows);
      else
          res.send({
              goodcount : 0
          })
  } catch(error){
      res.status(400).send({
          success: false
      })
  }
}

async function goodBoard(req: Request, res: Response){
  try{
      const user_id = req.session.userId;
      const board_id = req.params.id;

      const check = await db('SELECT good_id FROM BoardGood WHERE board_id=? and user_id=?',
      [board_id, user_id]);
      
      if(check[0]){
          await db('DELETE FROM boardgood WHERE good_id=?', [check[0].good_id]);
          res.json({
              success: true,
              msg : '좋아요 취소 성공'
          })
      } else{
          await db('INSERT INTO boardgood (user_id, board_id) VALUES (?, ?)', [user_id, board_id]);
          res.json({
              success: true,
              msg : '좋아요 성공'
          })
      }

      

  } catch(error){
      res.status(400).send({
          success: false,
      })
  }
}

async function myReplyBoard(req: Request, res: Response){
  try{
    const userId = req.session.userId;
    const rows = await db(`select board.* from (select distinct board_id from reply where user_id=?) as R 
    inner join board on R.board_id=board.board_id order by regdate desc`, [userId]);
    res.json(rows);

  } catch(error){
    res.status(400).send({
      success: false
    })
  }
}

function loginCheck(req: Request, res: Response, next: NextFunction){
  if(req.session.isLogedIn){
    next();
  } else{
    res.status(400).send({
      success: false,
      msg: '로그인이 필요합니다'
    })
  }
}

const router = Router();

// 게시글 좋아요
router.get('/good/:id', goodBoard);
router.get('/goodcount/:id', goodCount);

// 게시글 스크랩
router.get('/scrap', loginCheck, readScrapBoard);
router.get('/scrap/:id', loginCheck, scrapBoard);
router.get('/scrapcount/:id', scrapCount);

//내가 단 댓글 게시글 조회
router.get('/myreply', loginCheck, myReplyBoard);

// 게시글 CRUD
router.post('/', loginCheck, insertBoard);
router.get('/search', searchBoard);
router.get('/', readAllBoard);
router.get('/:id', readOneBoard);
router.put('/:id', loginCheck, updateBoard);
router.delete('/:id', loginCheck, deleteBoard);


export default router;