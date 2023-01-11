const { expect } = require('chai');
const request = require('supertest');
const { Reader } = require('../src/models');
const app = require('../src/app');

describe('/readers', () => {
  before(async () => Reader.sequelize.sync());

  beforeEach(async () => {
      await Reader.destroy({ where: {} });
  })

    describe('with no records in the database', () => {
        describe('POST /readers', () => {
            it('creates a new reader in the database', async () => {
                const response = await request(app).post('/readers').send({
                name: 'Benedict Cumberbatch',
                email: 'benny.cumbo@gmail.com',
                });

                const newReaderRecord = await Reader.findByPk(response.body.id, { raw: true });
                expect(response.status).to.equal(201);
                expect(response.body.name).to.equal('Benedict Cumberbatch');
                expect(newReaderRecord.name).to.equal('Benedict Cumberbatch');
                expect(newReaderRecord.email).to.equal('benny.cumbo@gmail.com');
            });
        });
    });

    describe('with records in the database', () => {
        let readers;

        beforeEach(async () => {
            readers = await Promise.all([
                Reader.create({ name: 'Benedict Cumberbatch', email: 'benny.cumbo@gmail.com' }),
                Reader.create({ name: 'Matt Warburton', email: 'warby@hotmail.com' }),
                Reader.create({ name: 'Yaya Toure', email: 'yaya@kolo.com' })
            ]);
        });

        describe('GET /readers', () => {
            it('gets all reader records', async () => {
                const response = await request(app).get('/readers');

                expect(response.status).to.equal(200);
                expect(response.body.length).to.equal(3);

                response.body.forEach((reader) => {
                    const expected = readers.find((a) => a.id === reader.id);

                    expect(reader.name).to.equal(expected.name);
                    expect(reader.email).to.equal(expected.email);
                });
            });
        });
        
        describe('GET /readers/:id', () => {
            it('gets a reader record by id', async () => {
                const reader = readers[0];
                const response = await request(app).get(`/readers/${reader.id}`);

                expect(response.status).to.equal(200);
                expect(response.body.name).to.equal(reader.name);
                expect(response.body.email).to.equal(reader.email);
            });

            it('returns a 404 if the reader does not exist', async () => {
                const response = await request(app).get('/readers/9999999'); 
                
                expect(response.status).to.equal(404);
                expect(response.body.message).to.equal("Reader 9999999 does not exist.");
            });
        });
        
        describe('PATCH /readers/:id', () => {
            it('updates reader email by id', async () => {
                const reader = readers[0];
                const response = await request(app).patch(`/readers/${reader.id}`)
                .send({ email: 'smitty@mclovin.com' });
                const updatedReaderRecord = await Reader.findByPk(reader.id, { raw: true });

                expect(response.status).to.equal(200);
                expect(updatedReaderRecord.email).to.equal('smitty@mclovin.com');
            });

            it('returns a 404 if the reader does not exist', async () => {
                const response = await request(app).patch('/readers/999999')
                .send({ email: 'smitty@mclovin.com' });

                expect(response.status).to.equal(404);
                expect(response.body.message).to.equal('Reader 999999 does not exist.');
            });
        });

        describe('DELETE /readers/:id', () => {
            it('deletes reader record by id', async () =>{
                const reader = readers[0];
                const response = await request(app).delete(`/readers/${reader.id}`);

                const deletedReader = await Reader.findByPk(reader.id, { raw: true });
                expect(response.status).to.equal(204);
                expect(deletedReader).to.equal(null);
            });

            it('returns a 404 if the reader does not exist', async () => {
                const response = await request(app).delete('/readers/999999');

                expect(response.status).to.equal(404);
                expect(response.body.message).to.equal('Reader 999999 does not exist.');
            });
        });
    });
});