declare module '@jeremybarbet/jsdap' {
    export type DODSResponse = {
        dds: DDSResponse,
        data: DataResponse
    }

    export type DDSResponse = {
        type: string,
        attributes: {[key: string]: unknown},
        [dataKey: string]: {
            type: string,
            name: string,
            id: string
        }
    } // Dataset Descriptor Set
    export type DASResponse = unknown //Dataset Attribute Structure
    export type DataResponse = {[dataKey: string]: unknown}
    const jsdap: {
        newRequest: (url: string, binary: unknown) => XMLHttpRequest;

        dodsRequestHandler: (xhr: XMLHttpRequest) => DODSResponse;

        ddsRequestHandler: (xhr: XMLHttpRequest) => DDSResponse

        dasRequestHandler: (xhr: XMLHttpRequest, dds: { type: string, attributes: unknown }) => DASResponse

        loadDataAndDDS: (url: string,
                         onLoad: (data: DODSResponse) => void,
                         onError?: (e: ProgressEvent) => void,
                         onAbort?: (e: ProgressEvent) => void,
                         onProgress?: (e: ProgressEvent) => void,
                         onTimeout?: (e: ProgressEvent) => void) => void

        loadDDS: (url: string,
                  onLoad: (data: DDSResponse) => void,
                  onError?: (e: ProgressEvent) => void,
                  onAbort?: (e: ProgressEvent) => void,
                  onProgress?: (e: ProgressEvent) => void,
                  onTimeout?: (e: ProgressEvent) => void) => void

        loadDAS: (url: string,
                  dds: DDSResponse,
                  onLoad: (data: DASResponse) => void,
                  onError?: (e: ProgressEvent) => void,
                  onAbort?: (e: ProgressEvent) => void,
                  onProgress?: (e: ProgressEvent) => void,
                  onTimeout?: (e: ProgressEvent) => void) => void

        loadData: (url: string,
                   onLoad: (data: DataResponse) => void,
                   onError?: (e: ProgressEvent) => void,
                   onAbort?: (e: ProgressEvent) => void,
                   onProgress?: (e: ProgressEvent) => void,
                   onTimeout?: (e: ProgressEvent) => void) => void

    }

    export default jsdap
}