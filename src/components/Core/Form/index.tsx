import { Form, FormContext } from "./Form";
import { Field } from "./Field";

export type FormContextType = {
  value: { [key: string]: any };
  onChange: (value: { [p: string]: any }) => void;
  isSubmitted: boolean;
  setValidateStatus: (validateStatus: any) => void;
};
export { Form, Field, FormContext };
