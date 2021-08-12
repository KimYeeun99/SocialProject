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

    it('급식 조회 기능', function(done){
        this.timeout(3000);
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
