import axios from 'axios';
import {BackendMessage, FilterQuery} from "./apiTypes.ts";

class Api {
    static #instance: Api;

    private constructor() {};

    public static get instance(): Api {
        if (!Api.#instance) {
            Api.#instance = new Api();
        }
        return Api.#instance;
    }

    /**
     * Handle errors and log the details.
     *
     * @param error - The error object to handle.
     * @returns {undefined} - Always returns undefined.
     */
    private handleError(error: unknown): undefined {
        if (axios.isAxiosError(error)) {
            console.error('Axios Error:', error.response?.data);
            console.error('Axios Status Code:', error.response?.status);
            console.error('Axios Headers:', error.response?.headers);
        } else {
            console.error('Unexpected Error:', error);
        }
        return undefined;
    }

    /**
     * Retrieve historical data with filters.
     *
     * @param backend - The base backend URL.
     * @param params - The filtering criteria for the historical data query.
     * @returns {Promise<BackendMessage | undefined>} - Resolves with the historical data on success.
     * If the request fails or encounters an error, `undefined` is returned.
     */
    public async getHistoryFilter(backend: string, params: FilterQuery): Promise<BackendMessage[] | undefined> {
        const url = `${backend}/history-filter/`;
        return axios.get<BackendMessage[]>(url, { params })
            .then(response => response.data)
            .catch(error => {return this.handleError(error);});
    }

    /**
     * Validate an S2 message against the schema.
     *
     * @param backend - The base backend URL.
     * @param message - The message object to validate.
     * @returns {Promise<string | undefined>} - Resolves with the response string on success.
     * If the request fails or encounters an error, `undefined` is returned.
     */
    public async validateMessage(backend: string, message: object): Promise<string | undefined> {
        const url = `${backend}/validate-message/`;
        return axios.post(url, { message })
            .then(response => response.data)
            .catch(error => {return this.handleError(error);});
    }

    /**
     * Inject a message into the backend.
     *
     * @param backend - The base backend URL.
     * @param originId - The origin ID of the message.
     * @param destId - The destination ID of the message.
     * @param message - The message object to be injected.
     * @returns {Promise<string | undefined>} - Resolves with the response string on success.
     * If the request fails or encounters an error, `undefined` is returned.
     */
    public async injectMessage(backend: string, originId: string, destId: string, message: object): Promise<string | undefined> {
        const url = `${backend}/inject/`;
        return axios.post(url, {
            origin_id: originId,
            dest_id: destId,
            message: message,
        })
            .then(response => response.data)
            .catch(error => {return this.handleError(error)});
    }
}

// Export the singleton instance
export const api = Api.instance;
