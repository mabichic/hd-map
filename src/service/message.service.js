import { Subject } from 'rxjs';

const msgSubject = new Subject();
const confirmSubject = new Subject();
const ladingSubject = new Subject();
const mapSubject = new Subject();
export const messageService = {
    sendMessage: (state, message) => msgSubject.next({ state: state, text: message }),
    clearMessages: () => msgSubject.next(),
    getMessage: () => msgSubject.asObservable()
};

export const confrimService = { 
    sendMessage: (state, message, onConfirm, onCancel) => confirmSubject.next({ state: state, text: message, onConfirm : onConfirm,  onCancel: onCancel }),
    clearMessages: () => confirmSubject.next(),
    getMessage: () => confirmSubject.asObservable()
}

export const isLoadingService = { 
    isLoading : state => ladingSubject.next({ isLoading : state}),
    getMessage: () => ladingSubject.asObservable()
}


export const mapService = {
    moveMap : (type, id) => mapSubject.next({type:type, id:id}),
    changeObject : (type, id, att) => mapSubject.next({type:type, id:id, att:att}),
    clearMessages: () => mapSubject.next(),
    getMessage: () => mapSubject.asObservable()
}