const {test, serial} = require('ava');
const Maybe = require('folktale/maybe');
const {initDB} = require('../../../test/helpers');
const {
  DEFAULT_USER_ID,
  createExtendedUser
} = require('../../../../common-api/test/helpers/account');
const {
  readUnsentDocuments,
  deleteDocument,
  deletePersonalDocument,
  readContractIds,
  setContractId,
  readDocuments,
  readSignedDocuments,
  readUnsignedDocuments,
  readPersonalDocuments,
  createPersonalDocument,
  createDocument,
  markAsSigned,
  documentExists,
  readContractType,

  createDocumentForToken,
  documentExistsForToken,
  readDocumentsForToken,
  readUnsentTokenDocuments,
  readSignedTokenDocuments,
  readUnsignedTokenDocuments
} = require('../documentRepository');
const {
  DEFAULT_DOCUMENT_ENVELOPE_ID,
  createDocumentData
} = require('../../../../common-api/test/helpers/document');
const {
  maybeValueGet,
  maybeValueReturn
} = require('../../../fn');
const {cleanDb} = require('../testRepository');
const {createToken} = require('../tokenRepository');
const {createTokenData} = require('../../../../common-api/test/helpers/token');

const token1 = createTokenData('1');
const token2 = createTokenData('2');
const tokenAddress1 = 'tokenaddress_1';
const tokenAddress2 = 'tokenaddress_2';

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await createToken(...Object.values(token1));
  await createToken(...Object.values(token2));
  await createExtendedUser(DEFAULT_USER_ID);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createDocument should create document and return object', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone);

  await createDocumentResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.name, name);
      t.is(data.templateId, templateId);
      t.is(data.signedByEveryone, signedByEveryone);
    }
  });

  const readDocumentsResult = await readDocuments();

  await readDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
      t.is(data[0].templateId, templateId);
    }
  });
});

serial('readDocuments should return array of objects documents', async t => {
  const documentData1 = createDocumentData(1, {});
  const documentData2 = createDocumentData(2, {});
  await createDocument(
    documentData1.name,
    documentData1.templateId,
    documentData1.signedByEveryone
  );
  await createDocument(
    documentData2.name,
    documentData2.templateId,
    documentData2.signedByEveryone
  );
  const readDocumentsResult = await readDocuments();

  await readDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
    }
  });
});

serial('deleteDocument should delete document', async t => {
  const documentData1 = createDocumentData(1, {});
  const documentData2 = createDocumentData(2, {});

  await createDocument(
    documentData1.name,
    documentData1.templateId,
    documentData1.signedByEveryone
  );

  await createDocument(
    documentData2.name,
    documentData2.templateId,
    documentData2.signedByEveryone
  );

  await deleteDocument(documentData1.templateId);

  const readDocumentsResult = await readDocuments();

  await readDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
      t.is(data[0].name, documentData2.name);
      t.is(data[0].templateId, documentData2.templateId);
      t.is(data[0].signedByEveryone, documentData2.signedByEveryone);
    }
  });
});

serial('deleteDocument should not delete document if templateId not found', async t => {
  const documentData1 = createDocumentData(1, {});
  const documentData2 = createDocumentData(2, {});

  await createDocument(
    documentData1.name,
    documentData1.templateId,
    documentData1.signedByEveryone
  );

  await createDocument(
    documentData2.name,
    documentData2.templateId,
    documentData2.signedByEveryone
  );

  await deleteDocument('test');

  const readDocumentsResult = await readDocuments();

  await readDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
    }
  });
});

serial('createPersonalDocument should create personal document for user by userId and documentId after return object', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone);

  const documentId = await createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const createPersonalDocumentResult = await createPersonalDocument(DEFAULT_USER_ID, documentId);

  await createPersonalDocumentResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.name, name);
      t.is(data.templateId, templateId);
      t.is(data.signedByEveryone, signedByEveryone);
    }
  });

  const readPersonalDocumentsResult = await readPersonalDocuments(DEFAULT_USER_ID);

  await readPersonalDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
      t.is(data[0].id, documentId);
    }
  });
});

serial('createPersonalDocument should return empty array if userId not found', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone);

  const documentId = await createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const createPersonalDocumentResult = await createPersonalDocument('test', documentId);

  t.true(Maybe.Nothing.hasInstance(createPersonalDocumentResult));

  const readPersonalDocumentsResult = await readPersonalDocuments(DEFAULT_USER_ID);

  readPersonalDocumentsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.fail.bind(t)
  });
});

serial('createPersonalDocument should return Nothing if documentId not found', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone);

  await createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const createPersonalDocumentResult = await createPersonalDocument(DEFAULT_USER_ID, -1);

  t.true(Maybe.Nothing.hasInstance(createPersonalDocumentResult));

  const readPersonalDocumentsResult = await readPersonalDocuments(DEFAULT_USER_ID);

  readPersonalDocumentsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.pass.bind(t)
  });
});

serial('readPersonalDocuments should return array of personal document object', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );
  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });

  await createPersonalDocument(DEFAULT_USER_ID, documentId1);
  await createPersonalDocument(DEFAULT_USER_ID, documentId2);

  const readPersonalDocumentsResult = await readPersonalDocuments(DEFAULT_USER_ID);

  await readPersonalDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
    }
  });
});

serial('deletePersonalDocument should delete personal document', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );

  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });

  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });

  await createPersonalDocument(DEFAULT_USER_ID, documentId1);
  await createPersonalDocument(DEFAULT_USER_ID, documentId2);
  await deletePersonalDocument(DEFAULT_USER_ID, documentId1);

  const readPersonalDocumentsResult = await readPersonalDocuments(DEFAULT_USER_ID);

  await readPersonalDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
    }
  });
});

serial('deletePersonalDocument should not delete personal document if userId not found', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );
  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });

  await createPersonalDocument(DEFAULT_USER_ID, documentId1);
  await createPersonalDocument(DEFAULT_USER_ID, documentId2);
  await deletePersonalDocument('test', documentId1);

  const readPersonalDocumentsResult = await readPersonalDocuments(DEFAULT_USER_ID);

  await readPersonalDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
    }
  });
});

serial('deletePersonalDocument should not delete personal document if documentId not found', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );
  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });

  await createPersonalDocument(DEFAULT_USER_ID, documentId1);
  await createPersonalDocument(DEFAULT_USER_ID, documentId2);
  await deletePersonalDocument(DEFAULT_USER_ID, -1);

  const readPersonalDocumentsResult = await readPersonalDocuments(DEFAULT_USER_ID);

  await readPersonalDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
    }
  });
});

serial('setContractId should set envelope id for document by documentId and userId after return object', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone);

  const documentId = await createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const setContractIdResult = await setContractId(
    DEFAULT_USER_ID,
    documentId,
    DEFAULT_DOCUMENT_ENVELOPE_ID
  );

  await setContractIdResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.contractId, DEFAULT_DOCUMENT_ENVELOPE_ID);
    }
  });

  const readContractIdsResult = await readContractIds(DEFAULT_USER_ID);

  await readContractIdsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
    }
  });
});

serial('setContractId should return Nothing if userId not found', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone);

  const documentId = await createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const setContractIdResult = await setContractId(
    'test',
    documentId,
    DEFAULT_DOCUMENT_ENVELOPE_ID
  );

  t.true(Maybe.Nothing.hasInstance(setContractIdResult));

  const readContractIdsResult = await readContractIds(DEFAULT_USER_ID);

  readContractIdsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.pass.bind(t)
  });
});

serial('setContractId should return Nothing if documentId not found', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone);

  await createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const setContractIdResult = await setContractId(
    DEFAULT_USER_ID,
    -1,
    DEFAULT_DOCUMENT_ENVELOPE_ID
  );

  t.true(Maybe.Nothing.hasInstance(setContractIdResult));

  const readContractIdsResult = await readContractIds(DEFAULT_USER_ID);

  readContractIdsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.pass.bind(t)
  });
});

serial('readContractIds should return array of of enveloper Ids', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );
  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentEnvelope1 = `${DEFAULT_DOCUMENT_ENVELOPE_ID}1`;
  const documentEnvelope2 = `${DEFAULT_DOCUMENT_ENVELOPE_ID}2`;

  await setContractId(
    DEFAULT_USER_ID,
    documentId1,
    documentEnvelope1
  );
  await setContractId(
    DEFAULT_USER_ID,
    documentId2,
    documentEnvelope2
  );

  const readContractIdsResult = await readContractIds(DEFAULT_USER_ID);

  await readContractIdsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
      t.true(data.some(item => item === documentEnvelope1));
      t.true(data.some(item => item === documentEnvelope2));
    }
  });
});

serial('markAsSigned should create mark the given document as signed', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData(1, {});
  const createDocumentResult = await createDocument(
    name,
    templateId,
    signedByEveryone
  );

  const documentId = createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  await setContractId(
    DEFAULT_USER_ID,
    documentId,
    DEFAULT_DOCUMENT_ENVELOPE_ID
  );

  const markAsSignedResult = await markAsSigned(DEFAULT_USER_ID, DEFAULT_DOCUMENT_ENVELOPE_ID);

  await markAsSignedResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.name, name);
      t.is(data.templateId, templateId);
      t.is(data.signedByEveryone, signedByEveryone);
    }
  });

  const readSignedDocumentsResult = await readSignedDocuments(DEFAULT_USER_ID);

  await readSignedDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
    }
  });
});

serial('markAsSigned should return Nothing if userId not found', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData(1, {});
  const createDocumentResult = await createDocument(
    name,
    templateId,
    signedByEveryone
  );

  const documentId = createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  await setContractId(
    DEFAULT_USER_ID,
    documentId,
    DEFAULT_DOCUMENT_ENVELOPE_ID
  );

  const markAsSignedResult = await markAsSigned('test', DEFAULT_DOCUMENT_ENVELOPE_ID);

  t.true(Maybe.Nothing.hasInstance(markAsSignedResult));

  const readSignedDocumentsResult = await readSignedDocuments(DEFAULT_USER_ID);

  readSignedDocumentsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.pass.bind(t)
  });
});

serial('markAsSigned should return Nothing if contarctId not found', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData(1, {});
  const createDocumentResult = await createDocument(
    name,
    templateId,
    signedByEveryone
  );

  const documentId = createDocumentResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  await setContractId(
    DEFAULT_USER_ID,
    documentId,
    DEFAULT_DOCUMENT_ENVELOPE_ID
  );

  const markAsSignedResult = await markAsSigned(DEFAULT_USER_ID, 'test');

  t.true(Maybe.Nothing.hasInstance(markAsSignedResult));

  const readSignedDocumentsResult = await readSignedDocuments(DEFAULT_USER_ID);

  readSignedDocumentsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.pass.bind(t)
  });
});

serial('readUnsentDocuments should return array of unsent document object', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );
  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  await createPersonalDocument(DEFAULT_USER_ID, documentId1);

  const readUnsentDocumentsResult = await readUnsentDocuments(DEFAULT_USER_ID);

  await readUnsentDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
      t.true(data.some(item => item.id === documentId1));
      t.true(data.some(item => item.id === documentId2));
    }
  });
});

serial('readSignedDocuments should return array of signed document object', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );
  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentEnvelope1 = `${DEFAULT_DOCUMENT_ENVELOPE_ID}1`;
  const documentEnvelope2 = `${DEFAULT_DOCUMENT_ENVELOPE_ID}2`;

  await setContractId(
    DEFAULT_USER_ID,
    documentId1,
    documentEnvelope1
  );
  await setContractId(
    DEFAULT_USER_ID,
    documentId2,
    documentEnvelope2
  );
  await markAsSigned(DEFAULT_USER_ID, documentEnvelope1);
  await markAsSigned(DEFAULT_USER_ID, documentEnvelope2);

  const readSignedDocumentsResult = await readSignedDocuments(DEFAULT_USER_ID);

  await readSignedDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
      t.true(
        data.some(
          item => item.contractId === documentEnvelope1 && item.templateId === createDocumentData1.templateId
        )
      );
      t.true(
        data.some(
          item => item.contractId === documentEnvelope2 && item.templateId === createDocumentData2.templateId
        )
      );
    }
  });
});

serial('readUnsignedDocuments should return array of unsigned document object', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocument(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone
  );
  const createDocument2Result = await createDocument(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.get('id')
  });
  await createPersonalDocument(DEFAULT_USER_ID, documentId1);

  const readUnsignedDocumentsResult = await readUnsignedDocuments(DEFAULT_USER_ID);

  await readUnsignedDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
      t.true(
        data.some(
          item => item.id === documentId1 && item.templateId === createDocumentData1.templateId
        )
      );
      t.true(
        data.some(
          item => item.id === documentId2 && item.templateId === createDocumentData2.templateId
        )
      );
    }
  });
});

serial('documentExists should return true if a document with the templateId exists', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  await createDocument(name, templateId, signedByEveryone);

  const documentExistsResult = await documentExists(templateId);
  const result = documentExistsResult.matchWith({
    Just: ({value}) => value
  });

  t.is(result, true);
});

serial('documentExists should return false if a document with the templateId does not exist', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  await createDocument(name, templateId, signedByEveryone);

  const documentExistsResult = await documentExists('templateId');
  documentExistsResult.matchWith({
    Just: () => t.fail(),
    Nothing: () => t.pass()
  });
});

serial('readContractType should return the type of the contract', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocument(name, templateId, signedByEveryone, 'docType');

  const documentId = createDocumentResult.matchWith({
    Just: maybeValueGet('id')
  });

  const setContractIdResult = await setContractId(
    DEFAULT_USER_ID,
    documentId,
    'contractId'
  );

  const contractId = setContractIdResult.matchWith({
    Just: maybeValueGet('contractId')
  });

  const readContractTypeResult = await readContractType(contractId);
  const documentType = readContractTypeResult.matchWith({
    Just: maybeValueReturn()
  });

  t.is(documentType, 'docType');
});

serial('readContractType should return Maybe.Nothing() if the contract does not exist', async t => {
  const readContractTypeResult = await readContractType('contractId');
  readContractTypeResult.matchWith({
    Just: t.fail.bind(t),
    Nothing: t.pass.bind(t)
  });
});

serial('createDocumentForToken should create a document for the token and return the document and token address', async t => {
  const {name, templateId, signedByEveryone} = createDocumentData('', {});
  const createDocumentResult = await createDocumentForToken(
    name,
    templateId,
    signedByEveryone,
    undefined,
    tokenAddress1
  );
  const createdId = createDocumentResult.matchWith({
    Just: ({value}) => value.getIn([0, 'id'])
  });
  const expectedResult = {
    name,
    tokenAddress: 'tokenaddress_1',
    id: createdId,
    type: 'undefined',
    signedByEveryone,
    templateId
  };

  await createDocumentResult.matchWith({
    Just: ({value}) => {
      const data = value.get(0).toJS();

      t.deepEqual(data, expectedResult);
    }
  });

  const readDocumentsResult = await readDocumentsForToken(tokenAddress1);

  await readDocumentsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.find(elem => elem.get('id') === createdId).toJS(), expectedResult);
      t.is(value.size, 1);
    }
  });
});

serial('readDocuments should return an array of documents', async t => {
  const documentData1 = createDocumentData(1, {});
  const documentData2 = createDocumentData(2, {});
  await createDocumentForToken(
    documentData1.name,
    documentData1.templateId,
    documentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  await createDocumentForToken(
    documentData2.name,
    documentData2.templateId,
    documentData2.signedByEveryone,
    undefined,
    tokenAddress1
  );
  const readDocumentsResult = await readDocumentsForToken(tokenAddress1);

  await readDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
    }
  });
});

serial('readDocuments should return only documents for the specified token', async t => {
  const documentData1 = createDocumentData(1, {});
  const documentData2 = createDocumentData(2, {});
  const documentData3 = createDocumentData(3, {});
  await createDocumentForToken(
    documentData1.name,
    documentData1.templateId,
    documentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  await createDocumentForToken(
    documentData2.name,
    documentData2.templateId,
    documentData2.signedByEveryone,
    undefined,
    tokenAddress1
  );
  await createDocumentForToken(
    documentData3.name,
    documentData3.templateId,
    documentData3.signedByEveryone,
    undefined,
    tokenAddress2
  );
  const readDocumentsResult = await readDocumentsForToken(tokenAddress1);

  await readDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data[0].tokenAddress, tokenAddress1);
      t.is(data[1].tokenAddress, tokenAddress1);
      t.is(data.length, 2);
    }
  });
});

serial('documentExistsForToken should return true if a document with the templateId exists for the given token', async t => {
  const documentData1 = createDocumentData(1, {});
  const documentData2 = createDocumentData(2, {});
  await createDocumentForToken(
    documentData1.name,
    documentData1.templateId,
    documentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  await createDocumentForToken(
    documentData2.name,
    documentData2.templateId,
    documentData2.signedByEveryone,
    undefined,
    tokenAddress2
  );

  const documentExistsResult = await documentExistsForToken(documentData1.templateId, tokenAddress1);
  const result = documentExistsResult.matchWith({
    Just: ({value}) => value.get('exists')
  });

  t.is(result, true);
});

serial('documentExistsForToken should return nothing if a document with the templateId does not exists for the given token', async t => {
  const documentData1 = createDocumentData(1, {});
  const documentData2 = createDocumentData(2, {});
  await createDocumentForToken(
    documentData1.name,
    documentData1.templateId,
    documentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  await createDocumentForToken(
    documentData2.name,
    documentData2.templateId,
    documentData2.signedByEveryone,
    undefined,
    tokenAddress2
  );

  const documentExistsResult = await documentExistsForToken(
    documentData1.templateId,
    tokenAddress2
  );

  documentExistsResult.matchWith({
    Just: t.fail.bind(t),
    Nothing: t.pass.bind(t)
  });
});

serial('readUnsentDocuments should return array of unsent documents for the token', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocumentForToken(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  await createDocumentForToken(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone,
    undefined,
    tokenAddress2
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.getIn([0, 'id'])
  });

  const readUnsentDocumentsResult = await readUnsentTokenDocuments(DEFAULT_USER_ID, tokenAddress1);

  await readUnsentDocumentsResult.matchWith({
    Just: ({value: data}) => {
      t.is(data.size, 1);
      t.true(data.some(item => item.get('id') === documentId1));
    }
  });
});

serial('createDocumentForToken should return only unsent documents for the token', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocumentForToken(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  const createDocument2Result = await createDocumentForToken(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone,
    undefined,
    tokenAddress1
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.getIn([0, 'id'])
  });

  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.getIn([0, 'id'])
  });

  await setContractId(DEFAULT_USER_ID, documentId1, 'contractId1');

  const readUnsentDocumentsResult = await readUnsentTokenDocuments(DEFAULT_USER_ID, tokenAddress1);

  await readUnsentDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
      t.true(data.some(item => item.id === documentId2));
    }
  });
});

serial('readSignedTokenDocuments should return array of signed documents of the token', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocumentForToken(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  const createDocument2Result = await createDocumentForToken(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone,
    undefined,
    tokenAddress2
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.getIn([0, 'id'])
  });
  const documentId2 = createDocument2Result.matchWith({
    Just: ({value}) => value.getIn([0, 'id'])
  });
  const documentEnvelope1 = `${DEFAULT_DOCUMENT_ENVELOPE_ID}1`;
  const documentEnvelope2 = `${DEFAULT_DOCUMENT_ENVELOPE_ID}2`;

  await setContractId(
    DEFAULT_USER_ID,
    documentId1,
    documentEnvelope1
  );
  await setContractId(
    DEFAULT_USER_ID,
    documentId2,
    documentEnvelope2
  );
  await markAsSigned(DEFAULT_USER_ID, documentEnvelope1);
  await markAsSigned(DEFAULT_USER_ID, documentEnvelope2);

  const readSignedDocumentsResult = await readSignedTokenDocuments(DEFAULT_USER_ID, tokenAddress1);

  await readSignedDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
      t.true(
        data.some(
          item => item.contractId === documentEnvelope1 && item.templateId === createDocumentData1.templateId
        )
      );
    }
  });
});

serial('readUnsignedDocuments should return array of unsigned document object', async t => {
  const createDocumentData1 = createDocumentData(1, {});
  const createDocumentData2 = createDocumentData(2, {});
  const createDocument1Result = await createDocumentForToken(
    createDocumentData1.name,
    createDocumentData1.templateId,
    createDocumentData1.signedByEveryone,
    undefined,
    tokenAddress1
  );
  await createDocumentForToken(
    createDocumentData2.name,
    createDocumentData2.templateId,
    createDocumentData2.signedByEveryone,
    undefined,
    tokenAddress2
  );

  const documentId1 = createDocument1Result.matchWith({
    Just: ({value}) => value.getIn([0, 'id'])
  });

  const readUnsignedDocumentsResult = await readUnsignedTokenDocuments(DEFAULT_USER_ID, tokenAddress1);

  await readUnsignedDocumentsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
      t.true(
        data.some(
          item => item.id === documentId1 && item.templateId === createDocumentData1.templateId
        )
      );
    }
  });
});
