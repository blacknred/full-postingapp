import { Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import router from 'next/router';
import React from 'react';
import InputField from '../../components/InputField';
import Layout from '../../components/Layout';
import Meta from '../../components/Meta';
import { useChangePasswordMutation } from '../../types';
import urqlClient from '../../lib/graphql/urql';
import { errorMap } from '../../utils';

interface IProps { }

const ForgotPassword: React.FC<IProps> = ({ }) => {
  const [, forgotPassword] = useChangePasswordMutation();

  return (
    <Layout variant="sm">
      <Meta title="Forgot password" />
      <Formik
        initialValues={{ email: "" }}
        onSubmit={(values, actions) => {
          forgotPassword(values)
            .then(res => {
              if (res.data?.changePassword.errors) {
                actions.setErrors(errorMap(res.data.changePassword.errors));
              } else {
                router.push({ pathname: '/login', hash: 'new-password-sent' })
              }
            })
            .catch(e => console.log(e.message))
            .finally(() => actions.setSubmitting(false));
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="email" label="Email" type="email" />
            <Button
              mt={4}
              colorScheme="teal"
              isLoading={isSubmitting}
              type="submit"
            >
              Confirm email
            </Button>
          </Form>
        )}
      </Formik>
    </Layout >
  );
}

export default withUrqlClient(urqlClient)(ForgotPassword)