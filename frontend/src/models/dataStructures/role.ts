import {RoleType} from "./roleType.ts";
import {Commodity} from "./commodity.ts";

export default interface Role{
    role: RoleType
    commodity: Commodity
}