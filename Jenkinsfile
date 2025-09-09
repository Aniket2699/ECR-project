pipeline {
  agent any

  environment {
    REPO_NAME = 'node-app'
    AWS_REGION = 'us-east-1'   // change as required
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Docker Image') {
      steps {
        script {
          // compute short commit hash
          COMMIT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
          sh "docker build -t ${REPO_NAME}:${COMMIT} ."
        }
      }
    }

    stage('Tag & Push to ECR') {
      steps {
        // Bind AWS creds stored as "Username with password" in Jenkins
        withCredentials([usernamePassword(credentialsId: 'aws-creds', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          script {
            ACCOUNT_ID = sh(script: "aws sts get-caller-identity --query Account --output text", returnStdout: true).trim()
            IMAGE_URI = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:${COMMIT}"

            sh """
              # configure aws env for aws cli
              export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
              export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
              export AWS_DEFAULT_REGION=${AWS_REGION}

              # ensure repo exists (idempotent - ignore error if exists)
              aws ecr describe-repositories --repository-names ${REPO_NAME} || aws ecr create-repository --repository-name ${REPO_NAME}

              # login docker to ecr
              aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

              docker tag ${REPO_NAME}:${COMMIT} ${IMAGE_URI}
              docker push ${IMAGE_URI}
            """
          }
        }
      }
    }

    stage('Post-build: notify Lambda') {
      steps {
        // read the lambda function URL from Jenkins secret text id 'lambda-url'
        withCredentials([string(credentialsId: 'lambda-url', variable: 'LAMBDA_URL')]) {
          script {
            // send JSON with image URI and metadata - httpRequest requires HTTP Request plugin
            def payload = """{ "image": "${IMAGE_URI}", "commit": "${COMMIT}", "author": "${GIT_COMMITTER_NAME ?: 'unknown'}" }"""
            httpRequest acceptType: 'APPLICATION_JSON',
                        contentType: 'APPLICATION_JSON',
                        httpMode: 'POST',
                        requestBody: payload,
                        url: "${LAMBDA_URL}"
          }
        }
      }
    }
  }

  post {
    success {
      echo "Pipeline finished successfully."
    }
    failure {
      echo "Pipeline failed."
    }
  }
}
