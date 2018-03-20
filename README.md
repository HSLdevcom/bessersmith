# bessersmith

Transform the custom MONO JSON feed (`mono/#` at `mqtt.hsl.fi`) into GTFS-realtime TripUpdates.

## Instructions

To install:
```sh
git clone https://github.com/hsldevcom/bessersmith
cd bessersmith
yarn install
```

To test:
```sh
yarn test
```

To run:
```sh
cp config.yaml.template config.yaml
# Modify the configuration
vim config.yaml
yarn start -c config.yaml
```
