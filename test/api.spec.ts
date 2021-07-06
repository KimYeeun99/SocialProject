import request from 'supertest';
var app = require('../src/app');

var token, refreshToken;

 function getdate(){
    var date = new Date();
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();
 
    return yyyy + (mm[1] ? mm : '0'+mm[0]) + (dd[1] ? dd : '0'+dd[0]);
}

const signInData = {
    id: 'appTest',
    password: '1234',
    name: 'testName',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 2,
    schoolnumber: 3,
    role: 'Master',
    year: 2021
}

describe('회원가입', function () {
    it('회원가입', function (done) {
        request(app)
            .post('/api/user/register')
            .send(signInData)
            .expect(200, done);
    })
})

describe('중복확인', function () {
    it('아이디 중복', function (done) {
        request(app)
            .post('/api/user/confirm/name')
            .send({ id: signInData.id })
            .expect(200, { success: true }, done);
    })

    it('아이디 미중복', function (done) {
        request(app)
            .post('/api/user/confirm/name')
            .send({ id: 38382578234 })
            .expect(200, { success: false }, done);
    })
})

describe('로그인', function () {
    it('로그인', function (done) {
        request(app)
            .post('/api/user/login')
            .send({
                id: signInData.id,
                password: signInData.password
            })
            .expect(200, function (err, res) {
                if (err) throw err;
                token = res.body.token.access_token;
                refreshToken = res.body.token.refresh_token;
                done();
            })
    })
})

describe('프로필 사진', function () {
    it('프로필 사진 등록', function (done) {
        request(app)
            .post('/api/user/profile')
            .set('Authorization', token)
            .set('Connection', 'keep-alive')
            .attach('profile', './test/default.jpg')
            .expect(200, done);
    });

    it('프로필 사진 조회', function (done) {
        request(app)
            .get('/api/user/profile?id=' + signInData.id)
            .expect(200, done)
    })

    it('프로필 사진 삭제', function (done) {
        request(app)
            .delete('/api/user/profile')
            .set('Authorization', token)
            .expect(200, done)
    })
})


describe('게시판', function () {
    var insertId;
    it('게시글 등록', function (done) {
        request(app)
            .post('/api/board?type=free')
            .set('Authorization', token)
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
        .set('Authorization', token)
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
            .set('Authorization', token)
            .send({
                title: "Mocha Change Test",
                body: "Mocha Change Body"
            })
            .expect(200, done);
    })

    it('게시글 삭제', function (done) {
        request(app)
            .delete('/api/board/' + insertId)
            .set('Authorization', token)
            .expect(200, done);
    })
})

describe('댓글', function () {
    var insertId, replyId;
    before(function (done) {
        request(app)
            .post('/api/board?type=free')
            .set('Authorization', token)
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
            .set('Authorization', token)
            .send({ body: 'Test Reply' })
            .expect(200, function (err, res) {
                if (err) throw err;

                replyId = res.body.data.insertId;
                done();
            })
    })

    it('대댓글 등록', function (done) {
        request(app)
            .post('/api/reply/' + insertId + '/' + replyId)
            .set('Authorization', token)
            .send({ body: 'Test Child Reply' })
            .expect(200, done);
    })

    it('댓글 조회', function (done) {
        request(app)
            .get('/api/reply/' + insertId)
            .expect(200, done);
    })

    it('댓글 수정', function (done) {
        request(app)
            .put('/api/reply/' + insertId + '/' + replyId)
            .set('Authorization', token)
            .send({ body: 'Test Change Reply' })
            .expect(200, done);
    })

    it('댓글 삭제', function (done) {
        request(app)
            .delete('/api/reply/' + insertId + '/' + replyId)
            .set('Authorization', token)
            .expect(200, done);
    })

    after(function (done) {
        request(app)
            .delete('/api/board/' + insertId)
            .set('Authorization', token)
            .expect(200, done);
    })
})

describe('좋아요/스크랩 기능', function () {
    var insertId, replyId;
    before(function (done) {
        request(app)
            .post('/api/board?type=free')
            .set('Authorization', token)
            .send({
                title: "Mocha Test",
                body: "Mocha Body"
            })
            .expect(200, function (err, res) {
                if (err) throw err;

                insertId = res.body.data.insertId;
                request(app)
                    .post('/api/reply/' + insertId)
                    .set('Authorization', token)
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
            .set('Authorization', token)
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
            .set('Authorization', token)
            .expect(200, done);
        })
    })
    

    describe('좋아요', function(){
        it('게시글 좋아요', function(done) {
            request(app)
            .get('/api/board/good/' + insertId)
            .set('Authorization', token)
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
            .set('Authorization', token)
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
        .set('Authorization', token)
        .expect(200, done);
    })
})

describe('토큰 기능', function() {
    it('토큰 검증', function(done) {
        request(app)
        .get('/api/auth/valid')
        .set('Authorization', token)
        .expect(200, function(err, res){
            if(err) throw err;

            if(res.body.data.id !== signInData.id){
                throw "Validation Error";
            } else{
                return done();
            }
        })
    })

    it('토큰 재발급', function(done){
        request(app)
        .get('/api/auth/refresh')
        .set('Authorization', refreshToken)
        .expect(200, done);
    })
})

describe('급식/학사정보', function(){
    const date = getdate();

    it('급식 조회 기능', function(done){
        request(app)
        .get('/api/school/cafeteria?AA_YMD=' + date)
        .expect(200, done);
    })

    it('학사정보 조회 기능', function(done) {
        request(app)
        .get('/api/school/schedule?MSLV_FROM_YMD=' + date + '&MSLV_TO_YMD=' + date)
        .expect(200, done)
    })
})


describe('로그아웃', function () {
    it('로그아웃', function (done) {
        request(app)
            .post('/api/user/logout')
            .set('Authorization', token)
            .expect(200, done);
    })
})

describe('회원탈퇴', function () {
    var token;
    before(function (done) {
        request(app)
            .post('/api/user/login')
            .send({
                id: signInData.id,
                password: signInData.password
            })
            .expect(200, function (err, res) {
                if (err) throw err;

                token = res.body.token.access_token;
                done();
            })
    })

    it('회원탈퇴', function (done) {
        request(app)
            .delete('/api/user/quit')
            .set('Authorization', token)
            .expect(200, done);
    })
})


