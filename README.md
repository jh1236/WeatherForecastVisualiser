# WeatherForecastVisualiser

Website for the visualisation of weather data provided from the BOREAS marine weather database

## Features

The website features a particle simulation built on [leaflet-velocity](https://github.com/onaci/leaflet-velocity/), as well as a
custom heatmap and svg pictograms for visualisation of meteorological and oceanographic data from
the [given THREDDS server](http://boreas.mywire.org:8080/thredds/catalog/catalog.html).

## Config

The only important argument that the program requires is the `CACHE_DIRECTORY` environment variable. By default, it is
set to the `./cachedResponses` folder, which comes with the repo. The docker compose file automatically creates a volume
then feeds its address in as this argument, ensuring the cache persists between sessions.

## Deployment

To deploy this server, use the builtin dockerfile by simply running ```docker compose up --build```. Doing so will start
the server on port 8080 (which can be configured in the compose.yml file).

## Notes

The `public/west_aus_coast_mp.json` file is an outline of the part the West Australian coastline that interacts with the
data from the server. This data is generated using the `generate_coastline` python project which is included, which
comes with a copy of
the [Australian coast data](https://www.data.gov.au/data/dataset/australian-coastline-50k-2024-nesp-mac-3-17-aims),
which is used to generate the relevant area for the site. 