'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import cn from 'classnames';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import * as Yup from 'yup';

const SignUpSchema = Yup.object().shape({
  displayName: Yup.string().required('Display name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const SignUp = () => {
  const supabase = createClientComponentClient();
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  async function signUp(formData) {
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          displayName: formData.displayName, // Add display name to user metadata
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Success! Please check your email for further instructions.');
    }
  }

  return (
    <div className="card">
      <h2 className="w-full text-center">Create Account</h2>
      <Formik
        initialValues={{
          displayName: '',
          email: '',
          password: '',
        }}
        validationSchema={SignUpSchema}
        onSubmit={signUp}
      >
        {({ errors, touched }) => (
          <Form className="column w-full">
            <label htmlFor="displayName">Display Name</label>
            <Field
              className={cn('input', errors.displayName && touched.displayName && 'bg-red-50')}
              id="displayName"
              name="displayName"
              placeholder="John Doe"
              type="text"
            />
            {errors.displayName && touched.displayName ? (
              <div className="text-red-600">{errors.displayName}</div>
            ) : null}

            <label htmlFor="email">Email</label>
            <Field
              className={cn('input', errors.email && 'bg-red-50')}
              id="email"
              name="email"
              placeholder="jane@acme.com"
              type="email"
            />
            {errors.email && touched.email ? (
              <div className="text-red-600">{errors.email}</div>
            ) : null}

            <label htmlFor="password">Password</label>
            <Field
              className={cn('input', errors.password && touched.password && 'bg-red-50')}
              id="password"
              name="password"
              type="password"
            />
            {errors.password && touched.password ? (
              <div className="text-red-600">{errors.password}</div>
            ) : null}

            <button className="button-inverse w-full" type="submit">
              Submit
            </button>
          </Form>
        )}
      </Formik>
      {errorMsg && <div className="text-red-600">{errorMsg}</div>}
      {successMsg && <div className="text-white">{successMsg}</div>}
      <Link href="/auth/sign-in" className="link w-full">
        Already have an account? Sign In.
      </Link>
    </div>
  );
};

export default SignUp;
