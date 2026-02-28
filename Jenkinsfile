pipeline {
  agent any

  options {
    timestamps()
    skipDefaultCheckout(true)
    timeout(time: 45, unit: 'MINUTES')
  }

  parameters {
    string(name: 'REACT_REPO_URL', defaultValue: 'https://github.com/manoj-tcz/react-client.git')
    string(name: 'REACT_REPO_BRANCH', defaultValue: 'main')

    string(name: 'AWS_ACCOUNT_ID', defaultValue: '723338844144')
    string(name: 'AWS_REGION', defaultValue: 'ap-south-1')
    string(name: 'EKS_CLUSTER_NAME', defaultValue: 'foodadvocate')
    string(name: 'K8S_NAMESPACE', defaultValue: 'default')

    string(name: 'REACT_ECR_REPOSITORY', defaultValue: 'react-client')
    string(name: 'IMAGE_TAG', defaultValue: '')
    string(name: 'VITE_API_BASE_URL', defaultValue: '')
  }

  environment {
    KUBECONFIG = "${WORKSPACE}/.kube/config"
  }

  stages {
    stage('Init Vars') {
      steps {
        script {
          env.FINAL_TAG = params.IMAGE_TAG?.trim() ? params.IMAGE_TAG.trim() : env.BUILD_NUMBER
          env.ECR_REGISTRY = "${params.AWS_ACCOUNT_ID}.dkr.ecr.${params.AWS_REGION}.amazonaws.com"
          env.REACT_ECR_REPO_VAL = params.REACT_ECR_REPOSITORY?.trim() ? params.REACT_ECR_REPOSITORY.trim() : 'react-client'
          env.REACT_IMAGE_URI = "${env.ECR_REGISTRY}/${env.REACT_ECR_REPO_VAL}:${env.FINAL_TAG}"
        }
        echo "Using image: ${env.REACT_IMAGE_URI}"
        echo "Using VITE_API_BASE_URL: '${params.VITE_API_BASE_URL ?: ''}'"
      }
    }

    stage('Checkout React Repo') {
      steps {
        deleteDir()
        git branch: "${params.REACT_REPO_BRANCH}", url: "${params.REACT_REPO_URL}"
      }
    }

    stage('Build & Push React Image') {
      steps {
        withCredentials([
          string(credentialsId: 'AWS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'AWS_SECRET_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
        ]) {
          sh '''#!/usr/bin/env bash
            set -euo pipefail

            aws ecr get-login-password --region "${AWS_REGION}" \
              | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

            docker build \
              --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL:-}" \
              -t "${REACT_ECR_REPO_VAL}:${FINAL_TAG}" .

            docker tag "${REACT_ECR_REPO_VAL}:${FINAL_TAG}" "${REACT_IMAGE_URI}"
            docker tag "${REACT_ECR_REPO_VAL}:${FINAL_TAG}" "${ECR_REGISTRY}/${REACT_ECR_REPO_VAL}:latest"

            docker push "${REACT_IMAGE_URI}"
            docker push "${ECR_REGISTRY}/${REACT_ECR_REPO_VAL}:latest"
          '''
        }
      }
    }

    stage('Deploy React Service') {
      steps {
        withCredentials([
          string(credentialsId: 'AWS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'AWS_SECRET_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
        ]) {
          sh '''#!/usr/bin/env bash
            set -euo pipefail
            NS="${K8S_NAMESPACE:-default}"

            mkdir -p "$(dirname "${KUBECONFIG}")"
            aws eks update-kubeconfig \
              --name "${EKS_CLUSTER_NAME}" \
              --region "${AWS_REGION}" \
              --kubeconfig "${KUBECONFIG}"

            kubectl --kubeconfig "${KUBECONFIG}" get ns "${NS}" >/dev/null 2>&1 || \
              kubectl --kubeconfig "${KUBECONFIG}" create ns "${NS}"

            kubectl --kubeconfig "${KUBECONFIG}" apply -f k8s/service.yaml -n "${NS}"
            kubectl --kubeconfig "${KUBECONFIG}" apply -f k8s/deployment.yaml -n "${NS}"

            if [[ -f "k8s/ingress.yaml" ]]; then
              kubectl --kubeconfig "${KUBECONFIG}" delete ingress app-ingress -n "${NS}" --ignore-not-found=true
              kubectl --kubeconfig "${KUBECONFIG}" apply -f k8s/ingress.yaml -n "${NS}"
            fi

            kubectl --kubeconfig "${KUBECONFIG}" set image deployment/react-client \
              react-client="${REACT_IMAGE_URI}" -n "${NS}"

            kubectl --kubeconfig "${KUBECONFIG}" rollout status deployment/react-client -n "${NS}" --timeout=300s
            kubectl --kubeconfig "${KUBECONFIG}" get deploy,svc,ingress,pods -n "${NS}" -o wide
          '''
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}
