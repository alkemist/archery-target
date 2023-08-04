import {FirebaseError} from './firebase.error';

export class PermissionDeniedError extends FirebaseError {
    override message = 'Permission Denied - User not logged';
}
