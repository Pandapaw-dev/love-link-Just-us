import { useQueryClient } from "@tanstack/react-query";
import { 
  useLoginUser as useGeneratedLogin,
  useRegisterUser as useGeneratedRegister,
  useLogoutUser as useGeneratedLogout,
  useUpdateMe as useGeneratedUpdateMe,
  usePairWithCode as useGeneratedPair,
  useDoCheckin as useGeneratedCheckin,
  useSendMessage as useGeneratedSendMessage,
  useSetMood as useGeneratedSetMood,
  useSendMissYou as useGeneratedSendMissYou,
  getGetMeQueryKey,
  getGetMyCoupleQueryKey,
  getGetTodayCheckinQueryKey,
  getGetStreakQueryKey,
  getGetMessagesQueryKey,
  getGetNotificationStatusQueryKey
} from "@workspace/api-client-react";

/**
 * These wrapper hooks use the generated API client but automatically 
 * handle React Query invalidations so the UI stays perfectly in sync.
 */

export function useAuthMutations() {
  const queryClient = useQueryClient();

  const login = useGeneratedLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyCoupleQueryKey() });
      }
    }
  });

  const register = useGeneratedRegister({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    }
  });

  const logout = useGeneratedLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = '/login';
      }
    }
  });

  const updateMe = useGeneratedUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    }
  });

  return { login, register, logout, updateMe };
}

export function useCoupleMutations() {
  const queryClient = useQueryClient();

  const pair = useGeneratedPair({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyCoupleQueryKey() });
      }
    }
  });

  return { pair };
}

export function useActionMutations() {
  const queryClient = useQueryClient();

  const doCheckin = useGeneratedCheckin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTodayCheckinQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
      }
    }
  });

  const sendMessage = useGeneratedSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      }
    }
  });

  const setMood = useGeneratedSetMood({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationStatusQueryKey() });
      }
    }
  });

  const sendMissYou = useGeneratedSendMissYou({
    mutation: {
      // Miss you is fire-and-forget for the sender usually, but let's invalidate status just in case
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationStatusQueryKey() });
      }
    }
  });

  return { doCheckin, sendMessage, setMood, sendMissYou };
}
