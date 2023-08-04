import {FirebaseError} from './firebase.error';

export class UnauthorizedDomainError extends FirebaseError {
    override message = 'Unauthorized Domain';
}
