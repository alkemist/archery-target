import {
    DatabaseError,
    DocumentMalformedError,
    DocumentNotFoundError,
    EmptyDocumentIdError,
    InvalidEmailError,
    OfflineError,
    QuotaExceededError,
    TooManyRequestError,
    WrongApiKeyError,
    WrongPasswordError
} from "@errors";
import {FirestoreDataConverter} from "@firebase/firestore";
import {LoggerService} from "@services";
import {generatePushID, slugify} from "@tools";
import {
    collection,
    CollectionReference,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    QueryConstraint,
    setDoc,
    where,
} from "firebase/firestore";
import {DocumentBackInterface, DocumentModel, HasIdInterface, HasIdWithInterface} from "@models";
import {objectConverter} from "../converters/object.converter";
import {MessageService} from "primeng/api";
import {environment} from "../../environments/environment";
import {VanillaError} from "../errors/vanilla.error";


export abstract class FirestoreService<
    I extends DocumentBackInterface,
    M extends DocumentModel
> {
    private readonly ref: CollectionReference;

    protected constructor(
        protected messageService: MessageService,
        protected loggerService: LoggerService,
        protected collectionName: string,
        protected collectionNameTranslated: string,
        protected type: (new (data: HasIdWithInterface<I>) => M),
        private converter: FirestoreDataConverter<I> = objectConverter<I>(),
    ) {
        this.ref = collection(getFirestore(), collectionName);
    }

    catchKnownErrors(error: VanillaError) {
        if (error.code === "auth/invalid-email") {
            return new InvalidEmailError();
        } else if (error.code === "auth/wrong-password" || error.code === "auth/_user-not-found") {
            return new WrongPasswordError();
        } else if (error.code === "auth/too-many-requests") {
            return new TooManyRequestError();
        } else if (error.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
            return new WrongApiKeyError();
        } else if (error.code === "auth/network-request-failed" || error.code === "unavailable") {
            this.messageService.add({
                severity: "error",
                detail: `${$localize`You are offline`}`
            });
            return new OfflineError();
        }
        return null;
    }

    catchErrors(error: VanillaError, obj?: any) {
        console.log(error.code, error)
        let customError = this.catchKnownErrors(error);

        if (!customError) {
            if (error.code === "invalid-argument") {
                customError = new DocumentMalformedError(
                    this.collectionName,
                    obj
                );
            } else {
                customError = new DatabaseError(
                    this.collectionName,
                    error.message,
                    obj
                );
            }
        }

        this.loggerService.error(customError);
        return Promise.reject(customError);
    }

    public async exist(name: string): Promise<boolean> {
        if (!name) {
            return false;
        }

        const slug = slugify(name);

        let dataObjectDocument = null;
        try {
            dataObjectDocument = await this.findOneBySlug(slug);
        } catch (error: VanillaError | DocumentNotFoundError | any) {
            if (error instanceof DocumentNotFoundError) {
                return false;
            }
        }
        return !!dataObjectDocument;
    }

    public async findOneById(id: string): Promise<HasIdWithInterface<I>> {
        let docSnapshot;

        if (environment["APP_OFFLINE"]) {
            return this.findOneBy("id", id);
        }

        try {
            const ref = doc(this.ref, id).withConverter(this.converter);
            docSnapshot = await getDoc(ref);
        } catch (error: VanillaError | any) {
            return this.catchErrors(error, {id});
        }

        if (!docSnapshot) {
            throw new DocumentNotFoundError(this.collectionName);
        }

        const document = docSnapshot.data();

        if (!document) {
            throw new DocumentNotFoundError(this.collectionName);
        }

        return {
            id: docSnapshot.id,
            ...document
        };
    }

    public async findOneBy(property: string, value: string): Promise<HasIdWithInterface<I>> {
        let list: HasIdWithInterface<I>[] = [];

        try {
            list = await this.queryList(where(property, "==", value));
        } catch (error) {
            return this.catchErrors(error as VanillaError, {[property]: value});
        }

        if (list.length === 0) {
            throw new DocumentNotFoundError(this.collectionName);
        }
        return list[0];
    }

    public async findOneBySlug(slug: string): Promise<HasIdWithInterface<I>> {
        return this.findOneBy("slug", slug);
    }

    public async addOne(document: M): Promise<HasIdWithInterface<I>> {
        const id = generatePushID();

        try {
            const ref = doc(this.ref, id).withConverter(this.converter);
            await setDoc(ref, document.toFirestore());
            this.messageService.add({
                severity: "success",
                detail: `${this.collectionNameTranslated} ${$localize`added`}`
            });
        } catch (error) {
            return this.catchErrors(error as VanillaError, document);
        }
        return await this.findOneById(id);
    }

    public async updateOne(document: M): Promise<HasIdWithInterface<I>> {
        if (!document.id) {
            throw new EmptyDocumentIdError(this.collectionName, document);
        }

        try {
            const ref = doc(this.ref, document.id).withConverter(this.converter);
            await setDoc(ref, document.toFirestore());
            this.messageService.add({
                severity: "success",
                detail: `${this.collectionNameTranslated} ${$localize`updated`}`,
            });
        } catch (error) {
            return this.catchErrors(error as VanillaError, document);
        }
        return await this.findOneById(document.id);
    }

    public async removeOne(document: HasIdInterface): Promise<void> {
        if (!document.id) {
            throw new EmptyDocumentIdError(this.collectionName, document);
        }

        try {
            const ref = doc(this.ref, document.id).withConverter(this.converter);
            await deleteDoc(ref);
            this.messageService.add({
                severity: "success",
                detail: `${this.collectionNameTranslated} ${$localize`deleted`}`
            });
        } catch (error) {
            return this.catchErrors(error as VanillaError, document);
        }
    }

    async getAll(orderByColumn = "name"): Promise<M[]> {
        const documents = await this.queryList(orderBy(orderByColumn));
        return documents.map((document: HasIdWithInterface<I>) => new this.type(document));
    }

    /**
     * On récupère la liste des documents
     * @param queryConstraints
     * @private
     */
    protected async queryList(...queryConstraints: QueryConstraint[]): Promise<HasIdWithInterface<I>[]> {
        const q = query(this.ref, ...queryConstraints).withConverter(this.converter);
        const documents: HasIdWithInterface<I>[] = [];

        /*if (parseInt(environment['APP_OFFLINE'] ?? '0')) {
          // Gérer les queryConstraints
          offlineData.map((d) => {
              return this.converter.fromFirestore({
                data(options?: SnapshotOptions): HasIdWithInterface<I> {
                  return d;
                },
              } as QueryDocumentSnapshot<HasIdWithInterface<I>>);
            }
          )
          return this.jsonService.importOfflineData<HasIdWithInterface<I>>(
            this.collectionName
          );
        }*/

        try {
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((docSnapshot) => {
                documents.push({
                    id: docSnapshot.id,
                    ...docSnapshot.data()
                });
            });

            /*if (isDevMode()) {
              await this.jsonService.writeOfflineData<HasIdWithInterface<I>>(
                this.collectionName,
                documents
              );
            }*/
        } catch (e) {
            const error = e as Error;

            if (error.message === "Quota exceeded.") {
                this.loggerService.error(new QuotaExceededError());
            } else {
                throw e;
            }
        }

        return documents;
    }


}
