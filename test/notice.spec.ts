
import 'should';
import should from 'should';
import request from 'supertest'
var app = require('../src/app');

const noticeUser = {
    id: 'noticeUser',
    password: '1234',
    name: 'notice',
    phone: '010-1111-2222',
    birth: '2021-01-01',
    schoolgrade: 1,
    schoolclass: 1,
    schoolnumber: 1,
    role: 'master',
    year: 2021,
    email: 'notice@notice.com'
}

const noticeData = [{
    title : "Notice Title",
    body : "Notice Body",
    board_id : 0
}, {
    title : "Notice Title2",
    body : "Notice Body2",
    board_id : 0
}, {
    title : "Notice Title3",
    body : "Notice Body3",
    board_id : 0
}]

const checkData = {
    "Notice Title" : noticeData[0],
    "Notice Title2" : noticeData[1],
    "Notice Title3" : noticeData[2]
}

describe('알림 기능', function(){
    var token;
    before(function(done){
        request(app)
        .post('/api/user/register')
        .send(noticeUser)
        .expect(200, done);
    })

    before(function(done){
        request(app)
        .post('/api/user/login')
        .send({
            id : noticeUser.id,
            password: noticeUser.password
        })
        .expect(200, function(err, res){
            if(err) throw err;

            token = res.body.token.access_token;
            done();
        })
    })

    before(function(done){
        request(app)
        .post('/api/board?type=free')
        .set('Authorization', token)
        .send({
            title: "Test title",
            body: "Test body"
        })
        .expect(200, function(err, res){
            if(err) throw err;

            noticeData.forEach(value => value.board_id = res.body.data.insertId);
            done();
        });
    })

    it('알림 추가', function(done){
        request(app)
        .post('/api/notice')
        .set('Authorization', token)
        .send({list:noticeData})
        .expect(200, function(err, res){
            if(err) throw err;
            should(res.body.success).be.exactly(true);
            done();
        });
    });

    it('알림 조회', function(done){
        request(app)
        .get('/api/notice')
        .set('Authorization', token)
        .expect(200, function(err, res){
            if(err) throw err;
            
            const data = res.body.data;

            data.forEach((element, index) => {
                should(element.title).be.exactly(checkData[element.title].title);
                should(element.body).be.exactly(checkData[element.title].body);
                should(element.board_id).be.exactly(checkData[element.title].board_id);
                should(element.type).be.exactly("free");
                should.exist(element.regdate);
                if(index == data.length-1){
                    done();
                }
            })            
        })
    })

    after(function(done){
        request(app)
        .delete("/api/user/quit")
        .set('Authorization', token)
        .expect(200, done);
    })
})