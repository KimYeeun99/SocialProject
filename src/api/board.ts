import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";

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
      success: true
    });
  } catch(error){
    res.status(400).send({
      success: false
    })
    
  }
}

async function searchBoard(req: Request, res: Response){
  try{
    const title = req.query.title;
    const rows = await db(`select * from board where title like ? or body like ? order by regdate desc`,
     ['%'+title+'%', '%'+title+'%']);
    res.json({
      success: true,
      data: rows
    });
  } catch(error){
    res.status(400).send({
      success: false
    })
  }

}

async function readAllBoard(req: Request, res: Response) {
  try{
    const rows = await db(`select * from board order by regdate desc`, []);
    res.json({
      success: true,
      data: rows
    });
  } catch(error){
    res.status(400).send({
      success: false
    })
  }  
}

async function readOneBoard(req:Request, res: Response) {
  try{
    const board_id = req.params.id;
    const rows = await db(`select * from board WHERE board_id=?`, [board_id]);
    res.json({
      success: true,
      data: rows
    });
  } catch(error){
    res.status(400).send({
      succes: false
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
    return res.status(401).send({success: false});

    const rows = await db('UPDATE board SET title=?, body=? WHERE board_id=?', [title, body, board_id]);
    res.json({
      success: true
    });
  } catch(error){
    res.status(400).send({
      success: false
    })
  }
}

async function deleteBoard(req:Request, res: Response) {
  try{
    const board_id = req.params.id;
    const check = await db('SELECT user_id FROM board WHERE board_id=? AND user_id=?',
     [board_id, req.session.userId]);

    if(!check[0]) return res.status(401).send({success: false});

    const rows = await db('DELETE FROM board WHERE board_id=?', [board_id]);
    res.json({
      success: true
    });
  } catch(error){
    res.status(400).send({
      success: false
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
        success: true
      })
    } else{
      await db('INSERT INTO scrap (board_id, user_id) VALUES (?, ?)', [boardId, userId]);
      res.json({
        success: true
      })
    }
    
  } catch(error){
    res.status(400).send({
      success: false
    })
  } 
}

async function readScrapBoard(req: Request, res: Response) {
    try {
        const userId = req.session.userId;

        const rows = await db(
            `select board.* from scrap inner join board on board.board_id=scrap.board_id where scrap.user_id=? order by regdate desc`,
            [userId]
        );

    res.json({
      success: true,
      data: rows
    });
  } catch(error){
    res.status(400).send({
      success: false
    })
  }
}

async function scrapCount(req: Request, res: Response){
  try{
    const boardId = req.params.id;
    const rows = await db('select count(scrap_id) as scrapcount from scrap where board_id=?', [boardId]);

    if(rows[0]){
      res.json({
        success: true,
        data: rows
      });
    } else{
      res.json({
        success: true,
        data : {scrapcount : 0}
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
          res.json({
            success: true,
            data: rows});
      else
          res.send({
              success: true,
              data : {goodcount : 0}
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
              success: true
          })
      } else{
          await db('INSERT INTO boardgood (user_id, board_id) VALUES (?, ?)', [user_id, board_id]);
          res.json({
              success: true
          })
      }
  } catch(error){
      res.status(400).send({
          success: false
      })
  }
}

// 여기까지

async function myReplyBoard(req: Request, res: Response){
  try{
    const userId = req.session.userId;
    const rows = await db(`select board.* from (select distinct board_id from reply where user_id=?) as R 
    inner join board on R.board_id=board.board_id order by regdate desc`, [userId]);
    res.json({
      success: true,
      data: rows
    });

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
    res.status(401).send({
      success: false
    })
  }
}

const router = Router();

// 게시글 좋아요
router.get("/good/:id", loginCheck, goodBoard);
router.get("/goodcount/:id", goodCount);

// 게시글 스크랩
router.get("/scrap", loginCheck, readScrapBoard);
router.get("/scrap/:id", loginCheck, scrapBoard);
router.get("/scrapcount/:id", scrapCount);

//내가 단 댓글 게시글 조회
router.get("/myreply", loginCheck, myReplyBoard);

// 게시글 CRUD
router.post('/', loginCheck, insertBoard);
router.get('/search', searchBoard);
router.get('/', readAllBoard);
router.get('/:id', readOneBoard);
router.put('/:id', loginCheck, updateBoard);
router.delete('/:id', loginCheck, deleteBoard);


export default router;
