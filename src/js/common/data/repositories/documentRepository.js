const {runQuery} = require('../query');
const {
  unwrapCypherSingleResult,
  getCount,
  unwrapCypherResult,
  normalizeParams
} = require('../utils');

const documentExists = async templateId => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document {templateId:"${templateId}"})
      RETURN exists(d.templateId)
      `
    );
    return unwrapCypherSingleResult(result, 'exists(d.templateId)');
  }
  catch(error) {
    throw new Error(`Error checking if document with templateId ${templateId} exists due to ${error.message}`);
  }
};

const documentExistsForToken = async (templateId, token) => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document {templateId:"${templateId}"})<-[r:HAS_DOCUMENT]-(t:Token {address: "${token}"})
      RETURN d {
        exists: exists(d.templateId)
      }
      `
    );
    return unwrapCypherSingleResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error checking if document with templateId ${templateId} exists for token ${token}: ${error.message}`);
  }
};

const readDocuments = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document)
      OPTIONAL MATCH (d)<-[:HAS_DOCUMENT]-(t:Token)
      RETURN d {
        .*,
        id: ID(d),
        tokenAddress: t.address
      }
      `
    );
    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error creating a new document: ${error.message}`);
  }
};

const readDocumentsForToken = async tokenAddress => {
  try {
    const result = await runQuery(
      `
      MATCH (t:Token {address: "${tokenAddress}"})-[r:HAS_DOCUMENT]->(d:Document)
      RETURN d {
        .*,
        id: ID(d),
        tokenAddress: t.address
      }
      `
    );
    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading document: ${error.message}`);
  }
};

const deleteDocument = async templateId => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document {templateId:"${templateId}"})
      DETACH DELETE d
      RETURN d
      `
    );
    return unwrapCypherSingleResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error deleting document with template id ${templateId}: ${error.message}`);
  }
};

const readSignedDocuments = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[hs:HAS_SIGNED]->(d:Document)
      RETURN d {
        .*,
        documentId: ID(d),
        contractId:hs.contractId
      }
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading signed documents: ${error.message}`);
  }
};

const readSignedTokenDocuments = async (userId, tokenAddress) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[hs:HAS_SIGNED]->(d:Document)<-[HAS_DOCUMENT]-(t:Token {address: "${tokenAddress}"})
      RETURN d {
        .*,
        documentId: ID(d),
        contractId:hs.contractId
      }
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading signed documents: ${error.message}`);
  }
};

const readUnsignedDocuments = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document {signedByEveryone:true}), (u:User {userId:"${userId}"})
      WHERE NOT (u)-[:HAS_SIGNED]->(d)
      OPTIONAL MATCH (u)-[hs:HAS_SENT]->(d)
      WITH u, d, hs
      RETURN d {.*, id: ID(d), contractId: hs.contractId}
      UNION
      MATCH (u:User {userId:"${userId}"})-[:HAS_PERSONAL]->(d:Document)
      WHERE NOT (u)-[:HAS_SIGNED]->(d)
      OPTIONAL MATCH (u)-[hs:HAS_SENT]->(d)
      WITH u, d, hs
      RETURN d {.*, id: ID(d), contractId: hs.contractId}
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading unsigned documents: ${error.message}`);
  }
};

const readUnsignedTokenDocuments = async (userId, tokenAddress) => {
  try {
    const result = await runQuery(
      `
      MATCH (t:Token {address: "${tokenAddress}"})-[HAS_DOCUMENT]->(d:Document {signedByEveryone:true}), (u:User {userId:"${userId}"})
      WHERE NOT (u)-[:HAS_SIGNED]->(d)
      RETURN d {.*, id: ID(d)}
      UNION
      MATCH (u:User {userId:"${userId}"})-[:HAS_PERSONAL]->(d:Document)
      WHERE NOT (u)-[:HAS_SIGNED]->(d)
      RETURN d {.*, id: ID(d)}
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading unsigned documents: ${error.message}`);
  }
};

const readPersonalDocuments = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[:HAS_PERSONAL]->(d:Document)
      RETURN d {.*, id: ID(d)}
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading documents that should be signed by the user ${userId}: ${error.message}`);
  }
};

const createPersonalDocument = async (userId, documentId) => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document), (u:User {userId:"${userId}"})
      WHERE ID(d)=${documentId}
      MERGE (u)-[:HAS_PERSONAL]->(d)
      RETURN d
      `
    );

    return unwrapCypherSingleResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error creating personal document ${documentId} for user ${userId}: ${error.message}`);
  }
};

const deletePersonalDocument = async (userId, documentId) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[ss:HAS_PERSONAL]->(d:Document)
      WHERE ID(d)=${Number(documentId)}
      WITH ss, properties(ss) as dss
      DELETE ss
      RETURN dss
      `
    );

    return unwrapCypherResult(result, 'dss');
  }
  catch(error) {
    throw new Error(`Error deleting personal document ${documentId} for user ${userId}: ${error.message}`);
  }
};

const readUnsentDocuments = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document {signedByEveryone: true}), (u:User {userId:"${userId}"})
      WHERE NOT (u)-[:HAS_SENT]->(d)
      RETURN d {.*, id: ID(d)}
      UNION
      MATCH (u:User {userId:"${userId}"})-[:HAS_PERSONAL]->(d:Document)
      WHERE NOT (u)-[:HAS_SENT]->(d)
      RETURN d {.*, id: ID(d)}
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading unsent documents ids: ${error.message}`);
  }
};

const readUnsentTokenDocuments = async (userId, tokenAddress) => {
  try {
    const result = await runQuery(
      `
      MATCH (t:Token {address: "${tokenAddress}"})-[HAS_DOCUMENT]->(d:Document {signedByEveryone: true}), (u:User {userId:"${userId}"})
      WHERE NOT (u)-[:HAS_SENT]->(d)
      RETURN d {.*, id: ID(d)}
      UNION
      MATCH (u:User {userId:"${userId}"})-[:HAS_PERSONAL]->(d:Document)
      WHERE NOT (u)-[:HAS_SENT]->(d)
      RETURN d {.*, id: ID(d)}
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error reading unsent documents ids: ${error.message}`);
  }
};

const readContractIds = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[hs:HAS_SENT]->(d:Document)
      RETURN hs.contractId
      `
    );

    return unwrapCypherResult(result, 'hs.contractId');
  }
  catch(error) {
    throw new Error(`Error reading documents contract ids: ${error.message}`);
  }
};

const readContractType = async contractId => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User)-[hs:HAS_SENT]->(d:Document)
      WHERE hs.contractId = "${contractId}"
      RETURN d.type
      `
    );

    return unwrapCypherSingleResult(result, 'd.type');
  }
  catch(error) {
    throw new Error(`Error reading documents contract ids: ${error.message}`);
  }
};

const setContractId = async (userId, documentId, contractId) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"}), (d:Document)
      WHERE ID(d)=${documentId}
      CREATE (u)-[hs:HAS_SENT {contractId:"${contractId}"}]->(d)
      RETURN hs
      `
    );

    return unwrapCypherSingleResult(result, 'hs');
  }
  catch(error) {
    throw new Error(`Error updating the contract id: ${error.message}`);
  }
};

const markAsSigned = async (userId, contractId) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[:HAS_SENT {contractId:"${contractId}"}]->(d:Document)
      MERGE (u)-[:HAS_SIGNED {contractId:"${contractId}"}]->(d)
      RETURN d
      `
    );
    return unwrapCypherSingleResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error marking a new document as signed: ${error.message}`);
  }
};

const createDocument = async (name, templateId, signedByEveryone, type) => {
  try {
    const result = await runQuery(
      `
      MERGE (d:Document {
        name:"${name}", 
        templateId:"${templateId}", 
        signedByEveryone:${signedByEveryone},
        type: "${type}"
      })
      RETURN d {.*, id: ID(d)}
      `
    );

    return unwrapCypherSingleResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error creating a new document: ${error.message}`);
  }
};

const createDocumentForToken = async (name, templateId, signedByEveryone, type, token) => {
  try {
    const result = await runQuery(
      `
      MATCH (t:Token {address: "${token}"})
      MERGE (t)-[r:HAS_DOCUMENT]->(d:Document {templateId:"${templateId}"})
      ON CREATE SET d+= {
        name:"${name}", 
        templateId:"${templateId}", 
        signedByEveryone:${signedByEveryone},
        type: "${type}"
      }
      RETURN d {
        .*,
        id: ID(d),
        tokenAddress: "${token}"
      }
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error creating a new document for token ${token}: ${error.message}`);
  }
};

const deleteDocuments = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (d:Document)
      DETACH DELETE d
      RETURN COUNT(d) as count
      `
    );

    return getCount(result);
  }
  catch(error) {
    throw new Error(`Error deleting documents due to ${error.message}`);
  }
};

module.exports = {
  documentExists: normalizeParams(documentExists),
  readUnsentDocuments: normalizeParams(readUnsentDocuments),
  deleteDocument: normalizeParams(deleteDocument),
  deletePersonalDocument: normalizeParams(deletePersonalDocument),
  readContractIds: normalizeParams(readContractIds),
  setContractId: normalizeParams(setContractId),
  readDocuments: normalizeParams(readDocuments),
  readSignedDocuments: normalizeParams(readSignedDocuments),
  readUnsignedDocuments: normalizeParams(readUnsignedDocuments),
  readPersonalDocuments: normalizeParams(readPersonalDocuments),
  createPersonalDocument: normalizeParams(createPersonalDocument),
  createDocument: normalizeParams(createDocument),
  markAsSigned: normalizeParams(markAsSigned),
  deleteDocuments: normalizeParams(deleteDocuments),
  readContractType: normalizeParams(readContractType),
  createDocumentForToken: normalizeParams(createDocumentForToken),
  documentExistsForToken: normalizeParams(documentExistsForToken),
  readDocumentsForToken: normalizeParams(readDocumentsForToken),
  readUnsentTokenDocuments: normalizeParams(readUnsentTokenDocuments),
  readSignedTokenDocuments: normalizeParams(readSignedTokenDocuments),
  readUnsignedTokenDocuments: normalizeParams(readUnsignedTokenDocuments)
};
