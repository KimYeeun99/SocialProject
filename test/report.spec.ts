import request from 'supertest';
var app = require('../src/app');

var loginToken;

const testData = {
    id: 'reportUser',
    password: '1234',
    name: 'report',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 1,
    schoolnumber: 1,
    role: 'master',
    year: 2021,
    email: 'temp@temp.com'
}

describe('신고 기능 테스트', function(){
    before(function(done){
        request(app)
        .post('/api/user/register')
        .send(testData)
        .expect(200, done);
    })
    
    before(function(done){
        request(app)
        .post('/api/user/login')
        .send({id: testData.id, password: testData.password})
        .expect(200, function(err, res){
            if(err) throw err;
    
            loginToken = res.body.token.access_token;
            done();
        })
    })
    
    describe('신고 기능', function(){
        var insertId;
        var replyId;
        //게시글 등록
        before(function(done){
            request(app)
            .post('/api/board?type=free')
            .set('Authorization', loginToken)
            .send({
                title : "Test Title",
                body : "Test body"
             })
            .expect(200, function(err, res){
                if (err) throw err
    
                    insertId = res.body.data.insertId;
                    done();
            });
        });
    
        //댓글 등록
        before(function(done){
            request(app)
            .post('/api/reply/' + insertId)
            .set('Authorization', loginToken)
            .send({body : "Test reply"})
            .expect(200, function(err, res){
                if (err) throw err;
    
                    replyId = res.body.data.insertId;
                    done();
            })
        })
    
    
        describe('게시판 신고', function() {
            it('게시판 신고하기', function(done){
                request(app)
                .post('/api/board/report')
                .set('Authorization', loginToken)
                .send({
                    board_id : insertId,
                    recv_id : "Test",
                    body : "Test body"
                })
                .expect(200, done);
            })
        
            it('내가 신고한 목록 조회 > 게시판', function(done){
                request(app)
                .get('/api/board/report/me')
                .set('Authorization', loginToken)
                .expect(200, done);
            })
    
            it('게시판 신고현황 조회 -> Master', function(done){
                request(app)
                .get('/api/board/report/count')
                .set('Authorization', loginToken)
                .expect(200, done);
            })
    
            it('ID값에 따른 신고내용 조회 > 게시판', function(done){
                request(app)
                .get('/api/board/report?id=Test')
                .set('Authorization', loginToken)
                .expect(200, done);
            })
        })
        
    
        describe('댓글 신고', function() {
            it('댓글 신고하기', function(done){
                request(app)
                .post('/api/reply/report')
                .set('Authorization', loginToken)
                .send({
                    reply_id : replyId,
                    recv_id : "Test",
                    body : "Test body"
                })
                .expect(200, done);
            })
        
            it('내가 신고한 목록 조회 > 댓글', function(done){
                request(app)
                .get('/api/reply/report/me')
                .set('Authorization', loginToken)
                .expect(200, done);
            })
    
            it('댓글 신고현황 조회 -> Master', function(done){
                request(app)
                .get('/api/board/report/count')
                .set('Authorization', loginToken)
                .expect(200, done);
            })
    
            it('ID값에 따른 신고내용 조회 > 댓글', function(done){
                request(app)
                .get('/api/reply/report?id=Test')
                .set('Authorization', loginToken)
                .expect(200, done);
            })
        })
    
        after(function(done){
            request(app)
            .delete('/api/board/' + insertId)
            .set('Authorization', loginToken)
            .expect(200, done);
        })
    })

    after(function(done){
        request(app)
        .delete('/api/user/quit')
        .set('Authorization', loginToken)
        .expect(200, done);
    })
})

