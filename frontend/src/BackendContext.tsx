import {createContext} from "react";

/**
 * This is the context that holds the backend url.
 *
 * Context allows us to pass down data to child components.tsx without having to pass it down as a property or parameter.
 * This is useful when we have a lot of components.tsx that need the same data, which, in this case, would be the
 * components that need the backend url to do the api calls.
 *
 * We give it an initial value of an empty string, but this will be overwritten by the App component.
 */
const BackendContext = createContext('');

export default BackendContext;
