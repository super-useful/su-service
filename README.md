# su-service

is a configurable layer you can add to your APIs, enabling you to make batch HTTP requests.

this can be handy for developing scalable and performant user interfaces — especially for mobile devices — as well as allowing you to call any number of different REST APIs, from different providers, manipulate the responses as a whole on the server before sending back the the aggregated response.

it also means that you can swap out different REST APIs — should you so wish, or even need to — and ensure that the final response is in the same format as the request was originally expecting.

this can help minimise the amount of changes and/or deployments that need to happen, as well as reducing the the overall number of places for error in your application stack.

service hosts and batches are defined in `yaml` format.

## defining hosts

in our example `services.yaml` file, we will define our hosts, in Array format under the `hosts` property, i.e:

```yaml

    hosts:
      -
        name: "host-1"
        ...
      -
        name: "host-2"
        ...
      -
        name: "host-N"
        ...

```

each host requires a minimum configuration of:

```yaml

    name: "example" # this will be used to identify which host to use in our batch requests
    protocol: "http:"
    hostname: "example.com"
    port: 80
    descriptor_uri: "/apis" # the base path of the API

```

### REST API running on su-apiserver

if one of your batch hosts is running `su-apiserver` you can add `format: "su-apiserver"` to your host configuration and su-service will retrieve all the endpoint configurations when it initialises the batch requests. e.g:

```yaml

    hosts:
      -
        name: "example"
        protocol: "http:"
        hostname: "example.com"
        port: 80
        descriptor_uri: "/apis"
        format: "su-apiserver"


```

### Any other REST API

alternatively, you will need to supply the endpoint configurations yourself, this would look something similar to:

```yaml

    hosts:
      -
        name: "themoviedb"
        protocol: "https:"
        hostname: "api.themoviedb.org"
        descriptor_uri: "/3"
    # if all endpoints require similar headers/query string parameters, e.g. API keys, you can add them under here
        defaults:
          headers:
            content-type: "application/json"
          query:
            api_key: "MY_SECRET_API_KEY"
        endpoints:
          - # example of a simple endpoint configuration with no extra parameters
            id: "configuration" # this will be used — inc conjunction with the host — to identify which endpoint to use in our batch requests
            method: "GET"
            url:
              pathname: "/configuration"
          - # example of an endpoint configuration which has one REST parameter `id`
            id: "movie-info"
            method: "GET"
            url:
              pathname: "/movie/:id"
          - # example of an endpoint configuration which has specific query string parameters
            id: "genre-movies"
            method: "GET"
            url:
              pathname: "/discover/movie"
              query:
                language: "en"
                sort_by:
                  - primary_release_date.desc
                  - popularity.desc

```

## defining batches

once we have all our host configurations — and their associated endpoint configurations, if required — defined, we then need to define our batch requests.

in our example `services.yaml` file, we will define our batches, in Associative Array format under the `batch` property.

Using the above host definitions as example we could have something like this:

```yaml

    batch:
      movie_defaults:
        example:
          foo: "endpoint-example"
        themoviedb:
          configuration: "configuration"
          genres: "genre-movies"

```

**IMPORTANT:** each service alias in each of the host batch requests should be unique across the entire batch. **If two service aliases have the same name: which ever returns first will be over-written by whichever returns last**.

## creating the services and batches

now that we have our services and batches defined, we need to actually create the service and batch requests, we do this first by parsing our `services.yaml` file into JavaScript and then passing the resulting `hosts` and `batch` to the su-service module, i.e:

```javascript

    var fs = require('fs');

    var yaml = require('js-yaml');

    var service = require('su-service');

    var SERVICES_CONFIG = yaml.load(fs.readFileSync('services.yaml', 'utf8'));

    module.exports = function* create() {
        return yield service(SERVICES_CONFIG.hosts, SERVICES_CONFIG.batch);
    };

```

this will return a JavaScript Object with a `batch` and `services` property from where we can call either individual `services` or make `batch` requests.

## calling individual services

assuming the [above code](#creating-the-services-and-batches) was in a module called `create_services.js`, we could call an individual service like this:

```javascript

    var create_services = require('./create_services');

    var service_batch = yield create_services;

    // if calling a su-apiserver API, all available versions/releases of the API will be automatically mounted
    var example_endpoint_data = yield service_batch.services.example.stable.endpoint.example({});

    // if calling any other REST API, you can simply call the
    var genre_movies_data = yield service_batch.services.themoviedb['genre-movies'].default({});

```

## making batch requests

assuming the [above code](#creating-the-services-and-batches) was in a module called `create_services.js`, we could call a batch request like this:

```javascript

    var create_services = require('./create_services');

    var service_batch = yield create_services;

    var movie_defaults = yield service_batch.batch.movie_defaults.default({});

```

## caveats
each su-service batch assumes the individual services will accept all or some of the parameters passed to it.

at the same time, sat you want to pass different parameters to different services, you can simply create two batches, call one with one set of parameters; then call the other with a different set of parameters and shallow copy it onto the first. e.g:

assuming we want to call one set of services with date information and one set of services without, we could define the following batches:

```yaml

    home_bydate:
      themoviedb:
        featured: "featured-movies"
        newest: "newest-movies"
    home_default:
      themoviedb:
        popular: "popular-movies"
        top_grossing: "top_grossing-movies"

```

then we could call both and return the aggregated data set:

```javascript

    var copy = require('useful-copy');
    var moment = require('moment-timezone');

    module.exports = function* service() {
        var date_format = 'YYYY-MM-DD';

    // calls one service batch which requires dates for sorting
        var data = yield this.su.api.batch.home_bydate.default({}, {
             'primary_release_date.gte' : moment().subtract(2, 'months').format(date_format),
             'primary_release_date.lte' : moment().format(date_format)
        });

    // then calls another service batch in which we do not want to sort by date; and
    // shallow copy the result onto the first batch
        copy(data, (yield this.su.api.batch.home_default.default()));

    // then returns the aggregated data
        return data;
    };

```
