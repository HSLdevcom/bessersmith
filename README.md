# bessersmith

Transform the custom MONO JSON feed (`mono/#` at `mqtt.hsl.fi`) into GTFS Realtime TripUpdates.

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
# Some configuration must be given, see below.
yarn start
```

### Configuration

[The included configuration file template](./config.yaml) contains all of the intended configuration options. The absolute minimum fields that must be provided are marked with a comment `# Required` above the name of the field. They may be provided as environment variables, as well.

Configuration priority, higher overrides lower:
1. A configuration file whose path is given as a command line option.
1. Environment variables except for `CONFIG_PATH`.
1. A configuration file whose path is given by the environment variable `CONFIG_PATH`. If a configuration file has been specified via a command line option, `CONFIG_PATH` is ignored.

E.g. `yarn start -c config.yaml` excludes any bessersmith-specific environment variables from being used.

Some configuration must be given, none is hardcoded. A configuration file is not strictly necessary.

A handy configuration pattern for deployment:
1. Copy `config.yaml` and replace the dummy values, especially the secrets like ClientIds, usernames and passwords.
1. Deliver the new configuration file into Docker Swarm as [a secret](https://docs.docker.com/engine/swarm/secrets/).
1. Point `CONFIG_PATH` to the secret. Do not use the command line option `-c`.
1. Override the non-secret values with the other environment variables as usual in the CI/CD pipeline.

The list of environment variables used by bessersmith:
- `CONFIG_PATH`: The path to the configuration file.
- `BUNYAN_NAME`: The value for the field `name` in [bunyan](https://github.com/trentm/node-bunyan) log messages.
- `BUNYAN_LEVEL`: The logging level used by bunyan. Currently one of `fatal`, `error`, `warn`, `info`, `debug` or `trace`.
- `MQTT_SUB_URL`: The URL of the MQTT broker used for subscribing. The string is given to the `connect` function in [MQTT.js](https://github.com/mqttjs/MQTT.js). Currently one of the following protocols must be used: `mqtt`, `mqtts`, `tcp`, `tls`, `ws` or `wss`.
- `MQTT_SUB_PORT`: The port for the MQTT broker used for subscribing.
- `MQTT_SUB_CLIENT_ID`: The ClientId for the subscribing connection. Make sure this differs from all other ClientIds, e.g. by using a random suffix.
- `MQTT_SUB_CLEAN`: A boolean on whether to use a clean session for subscribing. With `false` bessersmith asks for a persistent session.
- `MQTT_SUB_USERNAME`: The username for the subscribing connection.
- `MQTT_SUB_PASSWORD`: The password for the subscribing connection.
- `MQTT_SUB_QOS`: The Quality of Service level that bessersmith should subscribe with.
- `MQTT_SUB_TOPIC`: The topic that bessersmith should subscribe to to get the custom MONO JSON messages.
- `MQTT_PUB_URL`: The URL of the MQTT broker used for publishing. Running a broker on `localhost` may get useful.
- `MQTT_PUB_PORT`: The port for the MQTT broker used for publishing.
- `MQTT_PUB_CLIENT_ID`: The ClientId for the publishing connection. Make sure this differs from all other ClientIds, as well.
- `MQTT_PUB_CLEAN`: A boolean on whether to use a clean session for publishing.
- `MQTT_PUB_USERNAME`: The username for the publishing connection.
- `MQTT_PUB_PASSWORD`: The password for the publishing connection.
- `MQTT_PUB_QOS`: The Quality of Service level that bessersmith should publish with.
- `MQTT_PUB_TOPIC`: The topic into which bessersmith should publish GTFS Realtime TripUpdates.
- `CACHE_TTL_IN_SECONDS`: The time to live in seconds for any entry in the trip [cache](https://github.com/ptarjan/node-cache).
- `PROTO_PATH`: The path to the GTFS Realtime protocol buffer schema file.
