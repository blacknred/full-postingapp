import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import InputField from '../../components/InputField';
import Layout from '../../components/Layout';
import Meta from '../../components/Meta';
import { useChangePasswordMutation } from '../../typings';
import urqlClient from '../../urqlClient';
import { errorMap } from '../../utils';

interface IProps { }

const ChangePassword: React.FC<IProps> = ({ }) => {
  const [, changePassword] = useChangePasswordMutation();
  const router = useRouter();

  return (
    <Layout variant="sm">
      <Meta title="Change password" />
      <Formik
        initialValues={{ password: "", password2: "", token: "" }}
        onSubmit={(values, actions) => {
          if (values.password2 !== values.password) {
            actions.setErrors({ password2: 'Passwords differ' });
            actions.setSubmitting(false);
            return;
          }

          changePassword({ token: router.query.token as string, password: values.password })
            .then(res => {
              if (res.data?.changePassword.errors) {
                actions.setErrors(errorMap(res.data.changePassword.errors));
              } else {
                router.push({ pathname: '/login', hash: 'new-password-done' })
              }
            })
            .catch(e => console.log(e.message))
            .finally(() => actions.setSubmitting(false));
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="token" label="" hidden />
            <Box mt={4}>
              <InputField name="password" label="Password" type="password" />
            </Box>
            <Box mt={4}>
              <InputField name="password2" label="Repeat password" type="password" />
            </Box>
            <Button
              mt={4}
              colorScheme="teal"
              isLoading={isSubmitting}
              type="submit"
            >
              Change password
            </Button>
          </Form>
        )}
      </Formik>
    </Layout >
  );
}

export default withUrqlClient(urqlClient)(ChangePassword)