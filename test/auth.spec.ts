import request from 'supertest';
var app = require('../src/app');

var loginToken, refreshToken;

const testData = {
    id: 'authUser',
    password: '1234',
    name: 'test1',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 1,
    schoolnumber: 1,
    role: 'master',
    year: 2021,
    email: 'temp@temp.com'
}

describe('인증 테스트', function(){
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
            refreshToken = res.body.token.refresh_token;
            done();
        })
    })
    
    describe('학번 등록/인증', function(){
        it('학번 등록 -> Master', function(done){
            request(app)
            .post('/api/user/auth/student')
            .set('Authorization', loginToken)
            .attach('file', './test/test.xlsx')
            .expect(200, done);
        })
        
        it('학번 목록 조회 -> Master', function(done){
            request(app)
            .get('/api/user/auth/student')
            .set('Authorization', loginToken)
            .expect(200, done);
        })

        it('학번 인증하기', function(done){
            request(app)
            .post('/api/user/auth/student/check')
            .send({
                name : testData.name,
                studentId : '202110101'
            })
            .expect(200, done);
        })
    
        it('학번 삭제 -> Master', function(done){
            request(app)
            .delete('/api/user/auth/student')
            .set('Authorization', loginToken)
            .send({list : [
                {
                    name : 'test1',
                    studentId : '202110101'
                },
                {
                    name : 'test2',
                    studentId : '202110102'
                },
                {
                    name : 'test3',
                    studentId : '202110103'
                },
                {
                    name : 'test4',
                    studentId : '202110104'
                }
            ]})
            .expect(200, done);
        })
    })
    
    describe('토큰 기능', function() {
        it('토큰 검증', function(done) {
            request(app)
            .get('/api/auth/valid')
            .set('Authorization', loginToken)
            .expect(200, function(err, res){
                if(err) throw err;
    
                if(res.body.data.id !== testData.id){
                    throw "Validation Error";
                } else{
                    return done();
                }
            })
        })
    
        it('토큰 재발급', function(done){
            request(app)
            .post('/api/auth/refresh')
            .send({token : refreshToken})
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

