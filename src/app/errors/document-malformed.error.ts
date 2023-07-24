import {DatabaseError} from './database.error';

export class DocumentMalformedError extends DatabaseError {
    constructor(collectionName: string, context: Document) {
        super(collectionName, 'malformed', context);
    }
}
