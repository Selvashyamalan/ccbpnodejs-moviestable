const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'moviesData.db')
const app = express()
let db = null
app.use(express.json())

const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeServer()

const convertMovieDbToObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convertDirectorToObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.directorName,
  }
}

app.get('/movies/', async (request, response) => {
  const getMovieName = `SELECT movie_name FROM movie;`
  const movieName = await db.all(getMovieName)
  response.send(movieName.map(eachMovie => convertMovieDbToObject(eachMovie)))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const addMovie = `INSERT INTO movie(director_id, movie_name, lead_actor)
    VALUES(${directorId}, '${movieName}', '${leadActor}');`
  const movieAdd = await db.run(addMovie)
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getSingleMovie = `SELECT * FROM movie
    WHERE movie_id = '${movieId}';`
  const singleMovie = await db.get(getSingleMovie)
  response.send(convertMovieDbToObject(singleMovie))
})

app.put('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovie = `UPDATE movie
    SET director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id = '${movieId}';`
  await db.run(updateMovie)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const deleteMovie = `DELETE FROM movie
    WHERE movie_id = '${movieId}';`
  await db.run(deleteMovie)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectors = `
    SELECT * FROM director;`
  const directorList = await db.all(getDirectors)
  response.send(
    directorList.map(eachDirector => convertDirectorToObject(eachDirector)),
  )
})

app.get('directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getMovieDirector = `SELECT movie_name FROM movie
    WHERE director_id = '${directorId}';`
  const moviesName = await db.all(getMovieDirector)
  response.send(
    moviesName.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

module.exports = app
