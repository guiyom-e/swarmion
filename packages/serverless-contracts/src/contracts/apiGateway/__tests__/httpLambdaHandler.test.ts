/* eslint-disable max-lines */
import middy from '@middy/core';
import errorLogger from '@middy/error-logger';
import cors from '@middy/http-cors';
import type {
  APIGatewayEventRequestContextV2WithAuthorizer,
  APIGatewayProxyCognitoAuthorizer,
} from 'aws-lambda';
import createHttpError from 'http-errors';

import { getHandlerContextMock } from '__mocks__/requestContext';
import { ApiGatewayContract } from 'contracts';
import { getHandler } from 'features/lambdaHandler';

import { httpApiGatewayContractMock } from '../__mocks__/httpApiGatewayContract';
import {
  getRequestContextMock,
  getRequestContextMockV2,
} from '../__mocks__/requestContext';
import { SwarmionApiGatewayHandler } from '../types';

describe('apiGateway lambda handler', () => {
  describe('httpApi, with authorizer, when all parameters are set', () => {
    it('should return a 200 response', async () => {
      const httpApiContract = httpApiGatewayContractMock;

      const fakeRequestContext: APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayProxyCognitoAuthorizer> =
        {
          ...getRequestContextMockV2(),
          authorizer: { claims: { foo: 'claimBar' } },
        };
      const fakeContext = getHandlerContextMock();

      const httpHandler = getHandler(httpApiContract)(
        async ({
          body,
          pathParameters,
          queryStringParameters,
          headers,
          requestContext,
        }) => {
          await Promise.resolve();
          const myCustomClaim = requestContext.authorizer.claims.foo ?? '';

          const name =
            body.foo +
            pathParameters.pageNumber +
            queryStringParameters.testId +
            headers.myHeader +
            myCustomClaim;

          return Promise.resolve({ id: 'hello', name });
        },
      );

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ foo: 'bar' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: fakeRequestContext,
          version: '',
          routeKey: '',
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        fakeContext,
        () => null,
      );

      expect(result).toEqual({
        body: JSON.stringify({
          id: 'hello',
          name: 'bar15myTestIdMyCustomHeaderclaimBar',
        }),
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should return a error response when throwing httpError in handler', async () => {
      const httpApiContract = httpApiGatewayContractMock;

      const fakeRequestContext: APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayProxyCognitoAuthorizer> =
        {
          ...getRequestContextMockV2(),
          authorizer: { claims: { foo: 'claimBar' } },
        };
      const fakeContext = getHandlerContextMock();

      const httpHandler = getHandler(httpApiContract)(
        async ({
          body,
          pathParameters,
          queryStringParameters,
          headers,
          requestContext,
        }) => {
          await Promise.resolve();
          const myCustomClaim = requestContext.authorizer.claims.foo ?? '';

          const name =
            body.foo +
            pathParameters.pageNumber +
            queryStringParameters.testId +
            headers.myHeader +
            myCustomClaim;

          throw createHttpError(500, name, { expose: true });
        },
      );

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ foo: 'bar' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: fakeRequestContext,
          version: '',
          routeKey: '',
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        fakeContext,
        () => null,
      );

      expect(result).toMatchObject({
        body: 'bar15myTestIdMyCustomHeaderclaimBar',
        statusCode: 500,
      });
    });

    it('should return a error response when input is invalid', async () => {
      const httpApiContract = httpApiGatewayContractMock;

      const fakeRequestContext: APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayProxyCognitoAuthorizer> =
        {
          ...getRequestContextMockV2(),
          authorizer: { claims: { foo: 'claimBar' } },
        };
      const fakeContext = getHandlerContextMock();

      const httpHandler = getHandler(httpApiContract)(
        async ({
          body,
          pathParameters,
          queryStringParameters,
          headers,
          requestContext,
        }) => {
          await Promise.resolve();
          const myCustomClaim = requestContext.authorizer.claims.foo ?? '';

          const name =
            body.foo +
            pathParameters.pageNumber +
            queryStringParameters.testId +
            headers.myHeader +
            myCustomClaim;

          throw createHttpError(500, name);
        },
      );

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ bar: 'foo' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: fakeRequestContext,
          version: '',
          routeKey: '',
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        fakeContext,
        () => null,
      );

      expect(result).toEqual({
        body: 'Invalid input',
        statusCode: 400,
      });
    });

    it('should return a error response when output is invalid', async () => {
      const httpApiContract = httpApiGatewayContractMock;

      const fakeRequestContext: APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayProxyCognitoAuthorizer> =
        {
          ...getRequestContextMockV2(),
          authorizer: { claims: { foo: 'claimBar' } },
        };
      const fakeContext = getHandlerContextMock();

      const httpHandler = getHandler(httpApiContract)(() => {
        return Promise.resolve({ id: 'hello', name: 5 as unknown as string });
      });

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ foo: 'bar' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: fakeRequestContext,
          version: '',
          routeKey: '',
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        fakeContext,
        () => null,
      );

      expect(result).toMatchObject({
        body: 'Invalid output',
        statusCode: 400,
      });
    });

    it('should work well with middified handler (cors)', async () => {
      const httpApiContract = httpApiGatewayContractMock;

      const fakeRequestContext: APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayProxyCognitoAuthorizer> =
        {
          ...getRequestContextMockV2(),
          http: {
            method: 'OPTIONS',
            path: '',
            protocol: '',
            sourceIp: '',
            userAgent: '',
          },
          authorizer: { claims: { foo: 'claimBar' } },
        };
      const fakeContext = getHandlerContextMock();

      const handler: SwarmionApiGatewayHandler<
        typeof httpApiContract
      > = async ({
        body,
        pathParameters,
        queryStringParameters,
        headers,
        requestContext,
      }) => {
        await Promise.resolve();
        const myCustomClaim = requestContext.authorizer.claims.foo ?? '';

        const name =
          body.foo +
          pathParameters.pageNumber +
          queryStringParameters.testId +
          headers.myHeader +
          myCustomClaim;

        return Promise.resolve({ id: 'hello', name });
      };

      const middifiedHandler = middy(handler).use(errorLogger());

      const httpHandler = middy(
        getHandler(httpApiContract)(middifiedHandler),
      ).use(cors());

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ foo: 'bar' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: fakeRequestContext,
          version: '2.0',
          routeKey: '',
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        fakeContext,
        () => null,
      );

      expect(result).toMatchObject({
        body: '{"id":"hello","name":"bar15myTestIdMyCustomHeaderclaimBar"}',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        statusCode: 200,
      });
    });

    it('should accept optional additional arguments', async () => {
      const httpApiContract = httpApiGatewayContractMock;

      const fakeRequestContext: APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayProxyCognitoAuthorizer> =
        {
          ...getRequestContextMockV2(),
          authorizer: { claims: { foo: 'claimBar' } },
        };

      const httpHandler = getHandler(httpApiContract)(
        (
          _event,
          _context,
          _callback,
          toto: { tata: string } = { tata: 'coucou' },
        ) => {
          const name = toto.tata;

          return Promise.resolve({ name, id: 'miam' });
        },
      );
      const fakeContext = getHandlerContextMock();

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ foo: 'bar' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: fakeRequestContext,
          version: '',
          routeKey: fakeRequestContext.routeKey,
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        fakeContext,
        () => null,
      );

      expect(result).toEqual({
        body: '{"name":"coucou","id":"miam"}',
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should allow overriding of additional arguments', async () => {
      const httpApiContract = httpApiGatewayContractMock;

      const fakeRequestContext: APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayProxyCognitoAuthorizer> =
        {
          ...getRequestContextMockV2(),
          authorizer: { claims: { foo: 'claimBar' } },
        };

      const httpHandler = getHandler(httpApiContract)(
        async (
          _event,
          _context,
          _callback,
          toto: { tata: string } = { tata: 'blob' },
        ) => {
          await Promise.resolve();
          const name = toto.tata;

          return Promise.resolve({ name, id: 'toto' });
        },
      );
      const fakeContext = getHandlerContextMock();

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ foo: 'bar' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: fakeRequestContext,
          version: '',
          routeKey: fakeRequestContext.routeKey,
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        fakeContext,
        () => null,
        // @ts-expect-error typing is not yet great here
        { tata: 'blib' },
      );

      expect(result).toEqual({
        body: '{"name":"blib","id":"toto"}',
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('restApi, without authorizer, with subset of parameters', () => {
    it('should return a 200 response', async () => {
      const restApiContract = new ApiGatewayContract({
        id: 'testContract',
        path: '/hello',
        method: 'POST',
        integrationType: 'restApi',
        authorizerType: undefined,
        pathParametersSchema: undefined,
        queryStringParametersSchema: undefined,
        headersSchema: undefined,
        bodySchema: undefined,
        outputSchema: undefined,
      });

      const handler: SwarmionApiGatewayHandler<
        typeof restApiContract
      > = async () => {
        await Promise.resolve();

        return;
      };
      const fakeContext = getHandlerContextMock();

      const httpHandler = getHandler(restApiContract)(handler);

      const result = await httpHandler(
        {
          pathParameters: { userId: 'toto', pageNumber: '15' },
          body: JSON.stringify({ foo: 'bar' }),
          headers: {
            myHeader: 'MyCustomHeader',
            anotherHeader: 'anotherHeader',
          },
          queryStringParameters: { testId: 'myTestId' },
          requestContext: getRequestContextMock(),
          multiValueHeaders: {},
          httpMethod: '',
          isBase64Encoded: false,
          path: '',
          multiValueQueryStringParameters: null,
          stageVariables: null,
          resource: '',
        },
        fakeContext,
        () => null,
      );

      expect(result).toMatchObject({
        body: '',
        statusCode: 200,
      });
    });
  });
});
