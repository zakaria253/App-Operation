import express from 'express';
import mysql from 'mysql2';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();


// Définir __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directly define environment variables
const HOST = 'localhost';
const USER = 'webApp';
const PASSWORD = 'Xi7ebmX!X@QSHnPy';
const DATABASE = 'world';
const DB_PORT = 3306;
const PORT = 3000;

// Configuration du pool de connexions MySQL
const pool = mysql.createPool({
  host: HOST,
  user: USER,
  password: PASSWORD,
  database: DATABASE,
  port: DB_PORT
}).promise();

// Fonction pour exécuter les requêtes SQL
async function runQuery(query, params = []) {
  try {
    const [results] = await pool.query(query, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// Création de l'application Express.js
const app = express();

// Serve static files
app.use(express.static('public'));

// Home page route
app.get('/', (req, res) => {
  res.render('home', { title: 'World Data Project' });
});
// Définir le dossier des vues et le moteur de rendu
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Route pour tous les pays du monde classés par population décroissante
app.get('/countries/world', async (req, res) => {
  const query = `
    SELECT Name, Population
    FROM country
    ORDER BY Population DESC
  `;
  try {
    const countries = await runQuery(query);
    res.render('index', { title: 'All Countries by Population', countries });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

// Route pour les pays d'une région classés par population décroissante
app.get('/countries/region/:region', async (req, res) => {
  const region = req.params.region;
  const query = `
    SELECT Name, Population
    FROM country
    WHERE Region = ?
    ORDER BY Population DESC
  `;
  try {
    const countries = await runQuery(query, [region]);
    console.log(countries); // Log the retrieved data to check if it's correct
    res.render('index', { title: `Countries in ${region}`, countries });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

// Route pour les pays du monde avec une limite définie par l'utilisateur
app.get('/countries/world/:limit', async (req, res) => {
  const limit = parseInt(req.params.limit, 10);
  const query = `
    SELECT Name, Population
    FROM country
    ORDER BY Population DESC
    LIMIT ?
  `;
  try {
    const countries = await runQuery(query, [limit]);
    res.render('index', { title: `Top ${limit} Populated Countries in the World`, countries });
  } catch (error) {
    res.status(500).send('Error retrieving data');
  }
});

// Route pour les pays d'un continent avec une limite définie par l'utilisateur
app.get('/countries/continent/:continent/:limit', async (req, res) => {
  const continent = req.params.continent;
  const limit = parseInt(req.params.limit, 10);
  const query = `
    SELECT Name, Population
    FROM country
    WHERE Continent = ?
    ORDER BY Population DESC
    LIMIT ?
  `;
  try {
    const countries = await runQuery(query, [continent, limit]);
    res.render('index', { title: `Top ${limit} Populated Countries in ${continent}`, countries });
  } catch (error) {
    res.status(500).send('Error retrieving data');
  }
});

// Route for the top N populated cities in the world
app.get('/cities/world/:limit', async (req, res) => {
  const limit = parseInt(req.params.limit, 10);
  const query = `
    SELECT Name, CountryCode, District, Population
    FROM city
    ORDER BY Population DESC
    LIMIT ?
  `;
  try {
    const cities = await runQuery(query, [limit]);
    res.render('cities', { title: `Top ${limit} Populated Cities in the World`, cities });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

// Route for the top N populated cities in a continent
app.get('/cities/continent/:continent/:limit', async (req, res) => {
  const { continent, limit } = req.params;
  const query = `
    SELECT city.Name, city.CountryCode, city.District, city.Population
    FROM city
    JOIN country ON city.CountryCode = country.Code
    WHERE country.Continent = ?
    ORDER BY city.Population DESC
    LIMIT ?
  `;
  try {
    const cities = await runQuery(query, [continent, parseInt(limit, 10)]);
    res.render('cities', { title: `Top ${limit} Populated Cities in ${continent}`, cities });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

// Route for the top N populated cities in a region
app.get('/cities/region/:region/:limit', async (req, res) => {
  const { region, limit } = req.params;
  const query = `
    SELECT city.Name, city.CountryCode, city.District, city.Population
    FROM city
    JOIN country ON city.CountryCode = country.Code
    WHERE country.Region = ?
    ORDER BY city.Population DESC
    LIMIT ?
  `;
  try {
    const cities = await runQuery(query, [region, parseInt(limit, 10)]);
    res.render('cities', { title: `Top ${limit} Populated Cities in ${region}`, cities });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});
// Route for all cities in the world ordered by population
app.get('/cities/world', async (req, res) => {
  const query = `
    SELECT Name, CountryCode, District, Population
    FROM city
    ORDER BY Population DESC
  `;
  try {
    const cities = await runQuery(query);
    res.render('cities', { title: 'All Cities by Population', cities });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

// Route for detailed country report
app.get('/country/report', async (req, res) => {
  const query = `
    SELECT Code, Name, Continent, Region, Population, Capital
    FROM country
    ORDER BY Population DESC
  `;
  try {
    const countries = await runQuery(query);
    res.render('countryReport', { title: 'Country Report', countries });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

// Route for detailed city report
app.get('/city/report', async (req, res) => {
  const query = `
    SELECT city.Name AS CityName, country.Name AS CountryName, District, city.Population
    FROM city
    JOIN country ON city.CountryCode = country.Code
    ORDER BY city.Population DESC
  `;
  try {
    const cities = await runQuery(query);
    res.render('cityReport', { title: 'City Report', cities });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});


// Démarrage du serveur Express.js sur le port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
