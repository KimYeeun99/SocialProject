import request from 'supertest';
var app = require('../src/app');

const testData = {
    id: 'replyTest',
    password: '1234',
    name: 'reply',
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

describe('댓글 테스트', function(){
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
    
    describe('댓글', function () {
        var insertId, replyId;
        before(function (done) {
            request(app)
                .post('/api/board?type=free')
                .set('Authorization', loginToken)
                .send({
                    title: "Test Title",
                    body: "Test Body"
                })
                .expect(200, function (err, res) {
                    if (err) return done(err);
    
                    insertId = res.body.data.insertId;
                    done();
                });
        })
    
        it('댓글 등록', function (done) {
            request(app)
                .post('/api/reply/' + insertId)
                .set('Authorization', loginToken)
                .send({ body: 'Test Reply' })
                .expect(200, function (err, res) {
                    if (err) throw err;
                    replyId = res.body.data.reply_id;
                    done();
                })
        })
    
        it('대댓글 등록', function (done) {
            request(app)
                .post('/api/reply/' + insertId + '/' + replyId)
                .set('Authorization', loginToken)
                .send({ body: 'Test Child Reply' })
                .expect(200, function(err ,res){
                    if(err) throw err;
                    done();
                });
        })
    
        it('댓글 조회', function (done) {
            request(app)
                .get('/api/reply/' + insertId)
                .expect(200, done);
        })
    
        it('댓글 수정', function (done) {
            request(app)
                .put('/api/reply/' + insertId + '/' + replyId)
                .set('Authorization', loginToken)
                .send({ body: 'Test Change Reply' })
                .expect(200, done);
        })
    
        it('댓글 삭제', function (done) {
            request(app)
                .delete('/api/reply/' + insertId + '/' + replyId)
                .set('Authorization', loginToken)
                .expect(200, done);
        })
    
        after(function (done) {
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

