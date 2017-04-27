const should = require('should');
const request = require('supertest');
const app = require('../index');

const validUser = { password: 'secret', lastName: 'cheng', firstName: 'cui', email: 'cheng@example.com' };



describe('************* AUTH LOGIN *************', () => {
  before((done) => {
    request(app)
      .post('/api/auth/register')
      .set('X-Real-IP', URI)
      .type('form')
      .send(validUser)
      .expect(201)
      .end((err) => {
        if (err) done(err);
        done();
      });
  });

  after((done) => {
    const colls = 'users';
    mongoose.connection.collections[colls].drop(() => done());
  });

  it('should FAIL [400] to login without parameters', (done) => {
    request(app)
      .post('/api/auth/login')
      .set('X-Real-IP', URI)
      .expect(400, done);
  });

  it('should FAIL [400] to login with bad parameters', (done) => {
    request(app)
      .post('/api/auth/login')
      .set('X-Real-IP', URI)
      .type('form')
      .send({ wrongparam: 'err' })
      .expect(400, done);
  });

  it('should FAIL [401] to login with invalid credentials', (done) => {
    request(app)
      .post('/api/auth/login')
      .set('X-Real-IP', URI)
      .type('form')
      .send({ email: 'err', password: '22' })
      .expect(401, done);
  });

  it('should LOGIN [200] with valid credential', (done) => {
    request(app)
      .post('/api/auth/login')
      .set('X-Real-IP', URI)
      .type('form')
      .send(validUser)
      .expect(200)
      .end((err, res) => {
        if (err) done(err);
        res.body.token.should.be.an.instanceOf(String);
        res.body.user.should.be.an.instanceOf(Object);
        done();
      });
  });
});
