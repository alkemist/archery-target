import {Inject, Injectable} from "@angular/core";
import {BehaviorSubject, filter, map, Observable, of} from "rxjs";
import {FirestoreService} from "./firestore.service";
import {UserInterface, UserModel} from "@models";
import {DocumentNotFoundError, InvalidEmailError, UserNotExistError} from "@errors";
import {LoggerService} from "./logger.service";
import {
    getAuth,
    getRedirectResult,
    GoogleAuthProvider,
    isSignInWithEmailLink,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailAndPassword,
    signInWithEmailLink,
    signInWithRedirect,
    signOut,
    User
} from "firebase/auth";
import {MessageService} from "primeng/api";
import {FirebaseAuthError} from "../errors/firebase-auth.error";
import {Router} from "@angular/router";
import {DOCUMENT} from "@angular/common";
import {environment} from "../../environments/environment";
import {VanillaError} from "../errors/vanilla.error";

export type AppKey = "google";

@Injectable({
    providedIn: "root"
})
export class UserService extends FirestoreService<UserInterface, UserModel> {
    private auth = getAuth();
    private _isLoggedIn: BehaviorSubject<boolean | null>;
    private _user: UserModel | null = null;

    constructor(
        messageService: MessageService,
        loggerService: LoggerService,
        protected router: Router,
        @Inject(DOCUMENT) protected document: Document
    ) {
        super(messageService, loggerService, "user", $localize`User`, UserModel);
        this._isLoggedIn = new BehaviorSubject<boolean | null>(null);

        if (environment["APP_OFFLINE"]) {
            this._user = new UserModel({
                id: "",
                name: "",
                email: "",
                slug: "",
            });
        }

        onAuthStateChanged(this.auth, (userFirebase) => {
            if (environment["APP_OFFLINE"]) {
                this._isLoggedIn.next(true);
                return;
            }

            if (!userFirebase) {
                this._isLoggedIn.next(false);
            } else {
                void this.getUser(userFirebase);
            }
        });
    }

    get user() {
        return this._user as UserModel;
    }

    isLoggedIn(): Observable<boolean> {
        if (this._user) {
            return of(true);
        }

        return this._isLoggedIn.asObservable().pipe(
            filter((isLoggedIn) => isLoggedIn !== null),
            map((isLoggedIn) => !!isLoggedIn)
        );
    }

    login(email: string, password: string): Promise<void> {
        return signInWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => this.getUser(userCredential.user))
            .catch((error) => {
                throw this.catchKnownErrors(error);
            });
    }

    sendLoginLink(email: string) {
        return sendSignInLinkToEmail(this.auth, email, {
            // URL you want to redirect back to. The domain (www.example.com) for this
            // URL must be in the authorized domains list in the Firebase Console.
            url: `${this.document.location.origin}/authorize/email`,
            // This must be true.
            handleCodeInApp: true,
            /*android: {
              packageName: "com.alkemist.sweethome",
              installApp: true,
            },*/
        })
            .then(() => {
                window.localStorage.setItem("emailForSignIn", email);
            })
            .catch((error) => {
                this.loggerService.error(new FirebaseAuthError(error));
            });
    }

    isSignInWithEmailLink() {
        return isSignInWithEmailLink(this.auth, window.location.href);
    }

    loginWithLink() {
        let email = window.localStorage.getItem("emailForSignIn");

        if (email) {
            try {
                return signInWithEmailLink(this.auth, email, window.location.href)
                    .then((userCredential) => this.getUser(userCredential.user));
            } catch (error) {
                const customError = new FirebaseAuthError(error);
                this.loggerService.error(customError);
                return Promise.reject(error);
            }
        } else {
            const customError = new InvalidEmailError();
            this.loggerService.error(customError);
            return Promise.reject(customError);
        }
    }

    checkLoginWithProvider() {
        if (window.localStorage.getItem("loginWithProvider")) {
            return getRedirectResult(this.auth)
                .then((data) => {
                    if (data) {
                        return Promise.resolve(data);
                    }
                    return Promise.resolve(null);

                })
                .catch((error) => {
                    const customError = new FirebaseAuthError(error);
                    this.loggerService.error(customError);

                    throw customError;
                })
                .finally(() => {
                    window.localStorage.removeItem("loginWithProvider");
                });
        }
        return Promise.resolve(null);
    }

    loginWithProvider() {
        window.localStorage.setItem("loginWithProvider", "true");
        return signInWithRedirect(this.auth, new GoogleAuthProvider())
            .catch((error) => {
                return this.catchErrors(error);
            });
    }

    override catchErrors(error: VanillaError) {
        let customError = super.catchKnownErrors(error);

        if (!customError) {
            customError = new FirebaseAuthError(error);
        }

        this.loggerService.error(customError);
        return Promise.reject(customError);
    }

    async logout(): Promise<void> {
        return signOut(this.auth);
    }

    private getUser(userFirebase: User) {
        return this.findOneById(userFirebase.uid).then((dataUser) => {
            if (
                window.localStorage.getItem("emailForSignIn")
                || window.localStorage.getItem("loginWithProvider")
            ) {
                this.messageService.add({
                    severity: "success",
                    detail: `${$localize`Successfully logged`}`
                });

                window.localStorage.removeItem("emailForSignIn");
                window.localStorage.removeItem("loginWithProvider");
            }

            this._user = new UserModel(dataUser);
            this._isLoggedIn.next(true);
        }).catch((err) => {
            if (err instanceof DocumentNotFoundError) {
                this.messageService.add({
                    severity: "error",
                    detail: `${$localize`You are not authorized to use this application`}`
                });
                this._isLoggedIn.next(false);
                this.loggerService.error(new UserNotExistError());
            }
        });
    }
}
