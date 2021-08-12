import request from 'supertest';
var app = require('../src/app');

var loginToken;

const testData = {
    id: 'goodScrap',
    password: '1234',
    name: 'goodScrap',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 1,
    schoolnumber: 1,
    role: 'student',
    year: 2021,
    email: 'temp@temp.com'
}

describe('좋아요/스크랩 기능 테스트', function(){
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
    
    describe('좋아요/스크랩 기능', function () {
        var insertId, replyId;
        before(function (done) {
            request(app)
                .post('/api/board?type=free')
                .set('Authorization', loginToken)
                .send({
                    title: "Mocha Test",
                    body: "Mocha Body"
                })
                .expect(200, function (err, res) {
                    if (err) throw err;
    
                    insertId = res.body.data.insertId;
                    request(app)
                        .post('/api/reply/' + insertId)
                        .set('Authorization', loginToken)
                        .send({ body: 'Test Reply' })
                        .expect(200, function (err, res) {
                            if (err) throw err;
    
                            replyId = res.body.data.insertId;
                            done();
                        })
                });
        })
    
        describe('스크랩', function(){
            it('게시글 스크랩', function(done){
                request(app)
                .get('/api/board/scrap/' + insertId)
                .set('Authorization', loginToken)
                .expect(200, done);
            })
        
            it('게시글 스크랩 수 조회', function(done){
                request(app)
                .get('/api/board/scrapcount/' + insertId)
                .expect(200, done);
            })
        
            it('스크랩 게시글 조회', function(done){
                request(app)
                .get('/api/board/scrap')
                .set('Authorization', loginToken)
                .expect(200, done);
            })
        })
        
    
        describe('좋아요', function(){
            it('게시글 좋아요', function(done) {
                request(app)
                .get('/api/board/good/' + insertId)
                .set('Authorization', loginToken)
                .expect(200, done);
            })
        
            it('게시글 좋아요 갯수 조회', function(done){
                request(app)
                .get('/api/board/goodcount/' + insertId)
                .expect(200, done);
            })
            
        
            it('댓글 좋아요', function(done){
                request(app)
                .get('/api/reply/good/' + replyId)
                .set('Authorization', loginToken)
                .expect(200, done);
            })
        
            it('댓글 좋아요 갯수 조회', function(done){
                request(app)
                .get('/api/reply/goodcount/' + replyId)
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

