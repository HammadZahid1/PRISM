import type { CellValue, Dataset } from '@/types';
import { coerceCell, detectColumnType } from '@/lib/data/types';
import { slugify } from '@/lib/utils';

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDataset(
  name: string,
  description: string,
  headers: string[],
  records: CellValue[][],
  tags: string[],
  seed: number,
): Dataset {
  const ids = headers.map((header, index) => {
    const base = slugify(header);
    const collisions = headers.slice(0, index).filter((item) => slugify(item) === base).length;
    return collisions ? `${base}_${collisions + 1}` : base;
  });
  const rawRows = records.map((record) =>
    Object.fromEntries(ids.map((id, index) => [id, record[index] ?? null])),
  );
  const columns = headers.map((header, index) => {
    const type = detectColumnType(rawRows.map((row) => row[ids[index]]));
    return {
      id: ids[index],
      name: header,
      type,
      missing: rawRows.filter((row) => row[ids[index]] === null || row[ids[index]] === '').length,
      unique: new Set(rawRows.map((row) => String(row[ids[index]]))).size,
      sample: rawRows.slice(0, 3).map((row) => String(row[ids[index]])),
    };
  });
  const rows = rawRows.map((row) =>
    Object.fromEntries(columns.map((column) => [column.id, coerceCell(row[column.id], column.type)])),
  );
  const timestamp = Date.now() - seed * 1000;
  return {
    id: `preset_${slugify(name)}`,
    name,
    description,
    source: 'sample',
    columns,
    rows,
    createdAt: timestamp,
    updatedAt: timestamp,
    tags,
  };
}

function population(): Dataset {
  const rand = createRandom(11);
  const countries = [
    ['Asia', 'Japan'], ['Asia', 'India'], ['Asia', 'Indonesia'], ['Asia', 'Vietnam'],
    ['Europe', 'Germany'], ['Europe', 'France'], ['Europe', 'Poland'], ['Europe', 'Sweden'],
    ['Africa', 'Nigeria'], ['Africa', 'Kenya'], ['Africa', 'Egypt'], ['Africa', 'Ghana'],
    ['Americas', 'Brazil'], ['Americas', 'Canada'], ['Americas', 'Mexico'], ['Americas', 'Argentina'],
    ['Oceania', 'Australia'], ['Oceania', 'New Zealand'],
  ];
  const rows: CellValue[][] = [];
  for (let year = 2000; year <= 2024; year += 1) {
    countries.forEach(([region, country], index) => {
      const base = 18 + ((index * 37) % 140);
      rows.push([
        region,
        country,
        year,
        Math.round((base * (1 + (year - 2000) * (0.006 + rand() * 0.012))) * 10) / 10,
        Math.round((0.3 + rand() * 2.4) * 100) / 100,
        Math.round(35 + rand() * 45 + (year - 2000) * 0.35),
      ]);
    });
  }
  return buildDataset(
    'Global Population',
    'Illustrative regional population indicators, 2000–2024. Values are simulated for exploration.',
    ['Region', 'Country', 'Year', 'Population_Millions', 'Growth_Rate', 'Urban_Share'],
    rows,
    ['population', 'illustrative'],
    11,
  );
}

function solarSystem(): Dataset {
  const planets = [
    ['Mercury', 88, 0.39, 2439, 0, 0.055], ['Venus', 225, 0.72, 6052, 0, 0.815],
    ['Earth', 365, 1, 6371, 1, 1], ['Mars', 687, 1.52, 3390, 2, 0.107],
    ['Jupiter', 4333, 5.2, 69911, 95, 317.8], ['Saturn', 10759, 9.58, 58232, 146, 95.2],
    ['Uranus', 30687, 19.2, 25362, 28, 14.5], ['Neptune', 60190, 30.05, 24622, 16, 17.1],
  ] as CellValue[][];
  return buildDataset(
    'Solar System',
    'Approximate educational reference values for planetary orbits and physical properties.',
    ['Planet', 'Orbital_Period_Days', 'Distance_AU', 'Radius_KM', 'Moons', 'Mass_Earth'],
    planets,
    ['space', 'reference'],
    22,
  );
}

function technology(): Dataset {
  const rand = createRandom(33);
  const technologies = ['Cloud', 'AI tooling', 'Edge compute', 'Mobile', 'IoT', 'Automation'];
  const rows: CellValue[][] = [];
  for (let year = 2014; year <= 2025; year += 1) {
    technologies.forEach((technology, index) => {
      rows.push([
        year,
        technology,
        Math.min(98, Math.round((year - 2013) * (7 + index * 1.7) + rand() * 6)),
        Math.round((4 + rand() * 38 + index * 3) * 10) / 10,
        ['Global', 'Enterprise', 'Consumer'][index % 3],
      ]);
    });
  }
  return buildDataset(
    'Technology Trends',
    'Simulated adoption and investment trends for an illustrative technology outlook.',
    ['Year', 'Technology', 'Adoption_Percent', 'Investment_Billions', 'Segment'],
    rows,
    ['technology', 'simulated'],
    33,
  );
}

function climate(): Dataset {
  const rand = createRandom(44);
  const stations = ['North Ridge', 'Harbor', 'Highlands', 'Valley', 'Coastal', 'Desert Edge'];
  const rows: CellValue[][] = [];
  for (let month = 0; month < 36; month += 1) {
    stations.forEach((station, index) => {
      const date = new Date(Date.UTC(2022, month, 15));
      rows.push([
        station,
        date.toISOString().slice(0, 10),
        Math.round((8 + Math.sin(month / 6) * 9 + index * 1.5 + rand() * 3) * 10) / 10,
        Math.round(rand() * 120 + index * 6),
        Math.round(45 + rand() * 40),
        Math.round(405 + month * 0.6 + rand() * 8),
      ]);
    });
  }
  return buildDataset(
    'Climate Explorer',
    'Illustrative simulated climate observations across six fictional stations.',
    ['Station', 'Date', 'Temperature_C', 'Rainfall_mm', 'Humidity_Percent', 'CO2_ppm'],
    rows,
    ['climate', 'simulated'],
    44,
  );
}

function economy(): Dataset {
  const rand = createRandom(55);
  const countries = ['Arcadia', 'Borealia', 'Cassia', 'Duneland', 'Elyria', 'Forum', 'Galdor', 'Helvetia'];
  const sectors = ['Industry', 'Services', 'Technology', 'Energy'];
  const rows: CellValue[][] = [];
  for (let year = 2015; year <= 2025; year += 1) {
    countries.forEach((country, index) => {
      rows.push([
        country,
        year,
        Math.round((120 + index * 78 + (year - 2015) * (9 + rand() * 14)) * 10) / 10,
        Math.round((1 + rand() * 6) * 100) / 100,
        Math.round((4 + rand() * 7) * 100) / 100,
        sectors[index % sectors.length],
      ]);
    });
  }
  return buildDataset(
    'World Economy',
    'Simulated economic indicators for fictional countries; not historical data.',
    ['Country', 'Year', 'GDP_Billions', 'Inflation_Percent', 'Unemployment_Percent', 'Sector'],
    rows,
    ['economy', 'simulated'],
    55,
  );
}

function cities(): Dataset {
  const rand = createRandom(66);
  const cities = ['Aster', 'Brightwater', 'Cinder', 'Dawnport', 'Evergreen', 'Frostbay', 'Granite', 'Halcyon'];
  const countries = ['Northia', 'Southia', 'Eastia', 'Westia'];
  const rows: CellValue[][] = cities.flatMap((city, index) =>
    [2020, 2023].map((year) => [
      city,
      countries[index % countries.length],
      year,
      Math.round((0.4 + rand() * 8) * 100) / 100,
      Math.round(900 + rand() * 12000),
      Math.round(40 + rand() * 45),
      Math.round(8 + rand() * 25),
    ]),
  );
  return buildDataset(
    'City Statistics',
    'Illustrative urban indicators for fictional cities.',
    ['City', 'Country', 'Year', 'Population_Millions', 'Density_per_km2', 'Transit_Score', 'Green_Space_Percent'],
    rows,
    ['cities', 'simulated'],
    66,
  );
}

function missions(): Dataset {
  const rand = createRandom(77);
  const missions = [
    ['Aurora', 'Helios', 'Moon', 'Success'], ['Pathfinder', 'NASA-like', 'Mars', 'Success'],
    ['Vertex', 'ESA-like', 'Venus', 'Partial'], ['Kepler', 'Helios', 'Deep space', 'Success'],
    ['Nimbus', 'Orbital Labs', 'Earth', 'Success'], ['Horizon', 'Astro Co', 'Jupiter', 'Failure'],
    ['Lumen', 'Helios', 'Sun', 'Active'], ['Cinder', 'Orbital Labs', 'Asteroid', 'Success'],
  ];
  const rows: CellValue[][] = missions.flatMap(([mission, agency, destination, status], index) =>
    [0, 1, 2].map((run) => {
      const year = 2010 + index + run * 3;
      return [
        `${mission}-${run + 1}`,
        agency,
        `${year}-0${1 + (index % 9)}-15`,
        Math.round(60 + rand() * 1800),
        Math.round(40 + rand() * 900),
        destination,
        status,
      ];
    }),
  );
  return buildDataset(
    'Space Missions',
    'Fictional mission metadata created for visualization practice.',
    ['Mission', 'Agency', 'Launch_Date', 'Duration_Days', 'Budget_Millions', 'Destination', 'Status'],
    rows,
    ['space', 'simulated'],
    77,
  );
}

function markets(): Dataset {
  const rand = createRandom(88);
  const symbols = ['PRSM', 'NOVA', 'AXON', 'LUMI'];
  const rows: CellValue[][] = [];
  let start = new Date(Date.UTC(2024, 0, 1)).getTime();
  for (let day = 0; day < 120; day += 1) {
    symbols.forEach((symbol, index) => {
      const open = 40 + index * 22 + Math.sin(day / 9) * 6 + rand() * 4;
      const close = open + (rand() - 0.48) * 5;
      rows.push([
        new Date(start).toISOString().slice(0, 10),
        symbol,
        Math.round(open * 100) / 100,
        Math.round((Math.max(open, close) + rand() * 3) * 100) / 100,
        Math.round((Math.min(open, close) - rand() * 3) * 100) / 100,
        Math.round(close * 100) / 100,
        Math.round(100000 + rand() * 900000),
      ]);
    });
    start += 86400000;
  }
  return buildDataset(
    'Synthetic Financial Markets',
    'Clearly simulated market prices. No real securities or historical data are represented.',
    ['Date', 'Symbol', 'Open', 'High', 'Low', 'Close', 'Volume'],
    rows,
    ['finance', 'simulated'],
    88,
  );
}

export const presetFactories = [population, solarSystem, technology, climate, economy, cities, missions, markets];

export function createPresetDatasets(): Dataset[] {
  return presetFactories.map((factory) => factory());
}
