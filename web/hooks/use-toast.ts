"use client";

import * as React from "react";

import type {
  ToastActionElement,
  ToastProps,
} from "../components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 10000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  CLEAR_TOASTS: "CLEAR_TOASTS",
} as const;

type ActionType = typeof actionTypes[keyof typeof actionTypes];

interface Action {
  type: ActionType;
  toast?: ToasterToast;
  toastId?: string;
}

interface State {
  toasts: ToasterToast[];
}

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.DISMISS_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        ),
      };

    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    case actionTypes.CLEAR_TOASTS:
      return {
        ...state,
        toasts: [],
      };

    default:
      return state;
  }
}

function dispatch(action: Action) {
  memoryState = reduce(memoryState, action);

  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ ...props }: ToastProps) {
  const id = React.useId();

  const update = props.id
    ? (props: ToastProps) =>
        dispatch({
          type: actionTypes.ADD_TOAST,
          toast: { ...props, id: props.id } as ToasterToast,
        })
    : (props: ToastProps) =>
        dispatch({
          type: actionTypes.ADD_TOAST,
          toast: { ...props, id } as ToasterToast,
        });

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  const promise = Promise.resolve(props);

  return {
    id,
    dismiss,
    update,
    promise,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);

    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [setState]);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    clear: () => dispatch({ type: actionTypes.CLEAR_TOASTS }),
  };
}

export { useToast, toast, Toaster };
