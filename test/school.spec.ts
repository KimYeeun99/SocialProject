import request from 'supertest';
var app = require('../src/app');

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
