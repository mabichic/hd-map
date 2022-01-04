import { Subject } from 'rxjs';

const msgSubject = new Subject();
const confirmSubject = new Subject();
const ladingSubject = new Subject();
const mapSubject = new Subject();
const gridSubject = new Subject();
const fileSubject = new Subject();
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
    moveMap : (type, id) => mapSubject.next({service : 'moveMap', type:type, id:id}),
    changeObject : (type, id, att) => mapSubject.next({service : 'changeObject', type:type, id:id, att:att}),
    undoredo : (type) => mapSubject.next({service:'undoredo', type : type}),
    draw : (type) => mapSubject.next({service:'draw', type : type}),
    addObject : (feature) => mapSubject.next({service:'addObject', feature : feature}),
    selectDell : (type) => mapSubject.next({service:'selectDell', type : type}),
    dellObject : (feature) => mapSubject.next({service:'dellObject', feature : feature}),

    // selectMode : (type) => mapSubject.next({service:'selectMode', type : type}),
    generationGps : () => mapSubject.next({service:'generationGps'}),
    clear : () => mapSubject.next({service:'clear'}),
    clearMessages: () => mapSubject.next(),
    getMessage: () => mapSubject.asObservable()
}

export const gridService = { 
    sendMessage: (state, message) => gridSubject.next({ state: state, data: message }),
    clearMessages: () => gridSubject.next(),
    getMessage: () => gridSubject.asObservable()
}

export const fileService = { 
    sendMessage: (state, message) => fileSubject.next({ state: state, data: message }),
    clearMessages: () => fileSubject.next(),
    getMessage: () => fileSubject.asObservable()
}