import request from 'supertest';
var app = require('../src/app');

const testData = {
    id: 'boardTest',
    password: '1234',
    name: 'board',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 1,
    schoolnumber: 1,
    role: 'student',
    year: 2021,
    email: 'temp@temp.com'
}

var loginToken;

describe('게시판 테스트', function(){
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
    
    
    
    
    
    describe('게시판', function () {
        var insertId;
        it('게시글 등록', function (done) {
            request(app)
                .post('/api/board?type=free')
                .set('Authorization', loginToken)
                .send({
                    title: "Mocha Test",
                    body: "Mocha Body"
                })
                .expect(200, function (err, res) {
                    if (err) throw err
    
                    insertId = res.body.data.insertId;
                    done();
                });
        })
    
        it('게시글 전체 조회', function (done) {
            request(app)
                .get('/api/board?type=free')
                .expect(200, done);
        })
    
        it('게시글 상세 조회', function (done) {
            request(app)
                .get('/api/board/' + insertId)
                .expect(200, done);
        })
    
        it('내가 작성한 댓글 게시글 조회', function(done){
            request(app)
            .get('/api/board/myreply')
            .set('Authorization', loginToken)
            .expect(200, done);
        })
    
        it('게시글 검색', function (done) {
            request(app)
                .get('/api/board/search?type=free&title=Mocha')
                .expect(200, done);
        })
    
        it('게시글 수정', function (done) {
            request(app)
                .put('/api/board/' + insertId)
                .set('Authorization', loginToken)
                .send({
                    title: "Mocha Change Test",
                    body: "Mocha Change Body"
                })
                .expect(200, done);
        })
    
        it('게시글 삭제', function (done) {
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
});

