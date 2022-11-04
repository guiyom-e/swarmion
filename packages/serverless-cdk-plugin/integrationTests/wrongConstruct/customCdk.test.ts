import runServerless from '@serverless/test/run-serverless';
import { join } from 'path';

describe('customCdK', () => {
  it('throws when serverlessConstruct is not a construct', async () => {
    await expect(
      runServerless(join(__dirname, '../../node_modules/serverless'), {
        command: 'package',
        cwd: __dirname,
      }),
    ).rejects.toThrow('stack should be a ServerlessStack or a Stack');
  });
});
