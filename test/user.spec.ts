import request from 'supertest';
var app = require('../src/app');

var token, tempToken;

const signInData = {
    id: 'appTest',
    password: '1234',
    name: 'test1',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 1,
    schoolnumber: 1,
    role: 'master',
    year: 2021,
    email: 'Test@test.com'
}

const testData = {
    id: 'tempUser',
    password: '1234',
    name: 'temp',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 1,
    schoolnumber: 1,
    role: 'student',
    year: 2021,
    email: 'temp@temp.com'
}

const updateData = {
    phone: '010-6666-7777',
    birth: '2021-02-02',
    schoolgrade: 2,
    schoolclass: 2,
    schoolnumber: 2,
    year: 2022,
    email: 'temp2@temp.com'
}

describe('사용자 기능 테스트', function(){
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
                    done();
                })
        })
    })
    
    describe('본인정보 및 프로필 사진', function () {
        before(function(done){
            request(app)
            .post('/api/user/register')
            .send(testData)
            .expect(200, done);
        });
    
        before(function(done){
            request(app)
            .post('/api/user/login')
            .send({id : testData.id, password : testData.password})
            .expect(200, function(err, res){
                if(err) throw err;
    
                tempToken = res.body.token.access_token;
                done();
            }); 
        })
    
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
    
        it('본인 정보 조회', function(done){
            request(app)
            .get('/api/user/info')
            .set('Authorization', tempToken)
            .expect(200, done);
        })
    
        it('본인 정보 수정', function(done){
            request(app)
            .put('/api/user/info')
            .set('Authorization', tempToken)
            .send(updateData)
            .expect(200, done);
        })
    
        it('학생 등급 변경 -> Master', function(done){
            request(app)
            .put('/api/user/update/role')
            .set('Authorization', token)
            .send({user_id : testData.id, role : "leader"})
            .expect(200, done);
        })
    
        it('등록된 학생 목록 조회 -> Master', function(done){
            request(app)
            .get('/api/user/auth/master/student')
            .set('Authorization', token)
            .expect(200, done);
        })

        after(function(done){
            request(app)
            .delete('/api/user/quit')
            .set('Authorization', tempToken)
            .expect(200, done);
        })
    })
    
    
    describe('비밀번호 변경/찾기', function(){
        it('임시 비밀번호 발급 --> 별도 확인 필요', function(){});
    
        it('현재 패스워드 일치여부 확인', function(done){
            request(app)
            .post('/api/user/password/check')
            .set('Authorization', token)
            .send({password : "1234"})
            .expect(200, done);
        })
    
        it('패스워드 변경', function(done){
            request(app)
            .post('/api/user/password/change')
            .set('Authorization', token)
            .send({password : "12345"})
            .expect(200, done);
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
        var token
        before(function (done) {
            request(app)
                .post('/api/user/login')
                .send({
                    id: signInData.id,
                    password: "12345"
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
})

