import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";

export const replyScheme = yup.object({
    body: yup.string().required()
});

async function insertComment(req:Request, res: Response) {
    try{
        const {
            body
        } = replyScheme.validateSync(req.body);

        const board_id = req.params.boardid;
        const user_id = req.session.userId;

        const rows = await db('INSERT INTO reply (body, user_id, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?)',
         [body, user_id, board_id, 0, 0]);

        const data = JSON.parse(JSON.stringify(rows));

        await db('UPDATE reply SET parent_id=? WHERE reply_id=?', [data.insertId, data.insertId]);
        res.json({
            success: true,
            msg: '댓글 작성 완료'
        })
    } catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 작성 실패'
        })
    }
}

async function insertSubComment(req:Request, res: Response) {
    try{
        const parent_id = req.params.replyid;
        const board_id = req.params.boardid;
        const user_id = req.session.userId;
        const {
            body
        } = replyScheme.validateSync(req.body);


        const rows = await db('INSERT INTO reply (body, user_id, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?)',
         [body, user_id, board_id, parent_id, 1]);

        res.json({
            success: true,
            msg: '댓글 작성 완료'
        })

    } catch(error){
        res.status(400).send({
        success: false,
        msg: '댓글 작성 실패'
    })
    }
}

async function readAllComment(req:Request, res: Response) {
    try{
        const boardId = req.params.boardid;
        const rows = await db("select reply.*, ifNull(T.goods, 0) as goods from reply left join (select reply_id, count(reply_id) as goods from replygood group by reply_id) as T on T.reply_id=reply.reply_id where board_id=? order by parent_id, level, regdate", [boardId]);

        var data = JSON.parse(JSON.stringify(rows));

        var tree = [];
        var cnt = -1;
        for(var d=0; d<data.length; d++){
            if(data[d].level === 0){
                tree.push({
                    data: data[d],
                    child: []
                })
                cnt++;
            } else{
                if(cnt !== -1)
                tree[cnt].child.push(data[d]);
            }
        }
        res.json(tree);
        
    } catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 검색 실패'
        })
    }
}

async function updateComment(req: Request, res: Response){
    try{
        const user_id = req.session.userId;
        const reply_id = req.params.replyid;
        const {
            body
        } = replyScheme.validateSync(req.body);

        const check = await db('SELECT reply_id FROM reply WHERE reply_id=? and user_id=?', [reply_id, user_id]);

        if(!check[0]) return res.status(400).send({msg : '사용자가 일치하지 않습니다.'})

        const rows = await db('UPDATE reply SET body=? WHERE reply_id = ?', [body, reply_id]);

        res.json({
            success: true,
            msg: '댓글 수정 성공'
        });
    }
    catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 수정 실패'
        })
    }


}

async function deleteComment(req: Request, res: Response){
    try{
        const user_id = req.session.userId;
        const reply_id = req.params.replyid;
        const check = await db('SELECT reply_id FROM reply WHERE reply_id=? and user_id=?', [reply_id, user_id]);

        if(!check[0]) return res.status(400).send({msg : '사용자가 일치하지 않습니다.'})

        const rows = await db('DELETE FROM reply WHERE reply_id=? OR parent_id=?', [reply_id, reply_id]);

        res.json({
            success: true,
            msg: '댓글 삭제 성공'
        })
    } catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 삭제 실패'
        })
    }
}

async function goodComment(req: Request, res: Response){
    try{
        const user_id = req.session.userId;
        const reply_id = req.params.replyid;

        const check = await db('SELECT good_id FROM ReplyGood WHERE reply_id=? and user_id=?',
        [reply_id, user_id]);
        
        if(check[0]){
            await db('DELETE FROM replygood WHERE good_id=?', [check[0].good_id]);
        } else{
            await db('INSERT INTO replygood (user_id, reply_id) VALUES (?, ?)', [user_id, reply_id]);
        }

        res.json({
            success: true
        })

    } catch(error){
        res.status(400).send({
            success: false,
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
router.get('/good/:boardid/:replyid', loginCheck, goodComment);
router.post('/:boardid', loginCheck, insertComment);
router.post('/:boardid/:replyid', loginCheck, insertSubComment);
router.get('/:boardid', readAllComment);
router.put('/:boardid/:replyid', loginCheck, updateComment);
router.delete('/:boardid/:replyid', loginCheck, deleteComment);

export default router


