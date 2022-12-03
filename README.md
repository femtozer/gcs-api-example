# File API example

## Stack

- [Fastify](https://www.fastify.io/)
- [Google Cloud Storage](https://cloud.google.com/storage/docs/introduction)

## Run locally

In order to run the API locally, you need to download a [service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys?hl=fr).  
[ADC](https://cloud.google.com/docs/authentication/provide-credentials-adc?hl=fr) will not work because we need to generate signed URLs.

### Setup the .env file

```
ENV=local
GCP_SERVICE_ACCOUNT_KEY=<path to the SA key>
GCP_PROJECT_ID=<your project id>
BUCKET=<your bucket to store the uploaded files>
```

### Run the api

```bash
yarn install
yarn run start
```

### OpenAPI/Swagger

- [Swagger UI](http://localhost:3000/docs)

You can find the OpenAPI schema in the schemas directory.
