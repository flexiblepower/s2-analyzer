import axios from 'axios';
import {constructUrl} from "../utils/util.ts";
import {FilterQuery} from "./apiTypes.ts";

export class Api {
    public static async getHistoryFilter(backend: string, params: FilterQuery): Promise<any> {
        const url = constructUrl(`${backend}/history_filter`, params);
        const response = await axios.get(url);
        return response.data;
    }
}