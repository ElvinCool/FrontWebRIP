import { resolve } from 'path';
import { generateApi } from 'swagger-typescript-api';

generateApi({
    name: 'Api.ts',
    output: resolve(process.cwd(), './src/api'),
    url: 'http://localhost:8080/swagger/doc.json',
    httpClientType: 'axios',
    generateClient: true,
    generateRouteTypes: false,
    generateResponses: true,
    toJS: false,
    extractRequestParams: true,
    extractRequestBody: true,
    extractEnums: true,
    unwrapResponseData: false,
    defaultResponseAsSuccess: false,
    singleHttpClient: true,
    cleanOutput: true,
    enumNamesAsValues: false,
    moduleNameIndex: 1,
    generateUnionEnums: false,
    typePrefix: '',
    typeSuffix: '',
});

