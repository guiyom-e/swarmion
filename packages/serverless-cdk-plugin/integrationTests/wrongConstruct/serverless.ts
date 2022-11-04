import { AWS } from '@serverless/typescript';

import { ServerlessCdkPluginConfig } from 'types';

const serverlessConfiguration: AWS & ServerlessCdkPluginConfig = {
  service: 'test-app',
  configValidationMode: 'error',
  plugins: ['../../src'],
  provider: {
    name: 'aws',
  },
  custom: {
    cdkPlugin: {
      // This is the goal of the test
      // @ts-expect-error TS2741: Property 'isConstruct' is missing in type 'ErrorConstructor' but required in type 'typeof Construct'.
      stack: Error,
    },
  },
};

module.exports = serverlessConfiguration;
