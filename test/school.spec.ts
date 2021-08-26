import request from 'supertest';
var app = require('../src/app');

var loginToken

const testData = {
    id: 'schoolTest',
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

function getdate(){
    var date = new Date();
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();
 
    return yyyy + (mm[1] ? mm : '0'+mm[0]) + (dd[1] ? dd : '0'+dd[0]);
}

describe('급식/학사정보', function(){
    const date = getdate();

    it('학사정보 조회 기능', function(done){
        request(app)
        .get('/api/school/schedule?AA_YMD=' + date)
        .expect(200)
        .end(function(err, res){
            if(res.body.error != 'INFO-200 해당하는 데이터가 없습니다.'){
                throw err;
            }

            return done();
        })
    })

    it('급식 조회 기능', function(done) {
        request(app)
        .get('/api/school/cafeteria?MLSV_FROM_YMD=' + date + '&MLSV_TO_YMD=' + date)
        .expect(200)
        .end(function(err, res){
            if(res.body.error != 'INFO-200 해당하는 데이터가 없습니다.'){
                return done(err);
            }

            done();
        })
    })
})

describe('시간표 기능', function(){
    describe("시간표 테스트", function(){
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
    
        it('시간표 등록', function(done){
            request(app)
            .post('/api/school/timetable')
            .set('Authorization', loginToken)
            .send({
                list : [{
                    "subject" : "Math",
                    "days" : "mon",
                    "period" : 1
                },
                {
                    "subject" : "Math",
                    "days" : "tue",
                    "period" : 2
                },
                {
                    "subject" : "Math",
                    "days" : "tue",
                    "period" : 3
                }]
            })
            .expect(200, done);
        })
    
        it('시간표 조회', function(done){
            request(app)
            .get('/api/school/timetable')
            .set('Authorization', loginToken)
            .expect(200, done);
        })
    
    
        it('시간표 수정', function(done){
            request(app)
            .put('/api/school/timetable')
            .set('Authorization', loginToken)
            .send({
                list : [{
                    "subject" : "English",
                    "days" : "mon",
                    "period" : 1
                    }
                ]
            })
            .expect(200, done);
        })
    
        it('시간표 삭제', function(done){
            request(app)
            .delete('/api/school/timetable')
            .set('Authorization', loginToken)
            .send({
                list : [{
                    "subject" : "Math",
                    "days" : "tue",
                    "period" : 2
                },
                {
                    "subject" : "English",
                    "days" : "mon",
                    "period" : 1
                }]
            })
            .expect(200, done);
        })
    
        after(function(done){
            request(app)
            .delete('/api/user/quit')
            .set('Authorization', loginToken)
            .expect(200, done);
        })
    })
})
