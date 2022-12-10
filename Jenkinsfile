#!/usr/bin/env groovy

pipeline {
    agent any

    environment {

        REPOSITORY_NAME='prod'
       
        AWS_ECR_REGION = 'ap-south-1'
        AWS_ECS_SERVICE = 'K6Service'
        AWS_ECS_TASK_DEFINITION = 'k6'
        AWS_ECS_COMPATIBILITY = 'EC2'
        AWS_ECS_NETWORK_MODE = 'awsvpc'
        AWS_ECS_CPU = '256'
        AWS_ECS_MEMORY = '512'
        AWS_ECS_CLUSTER = 'default'
        AWS_ECS_TASK_DEFINITION_PATH = 'deployment.json'

        AWS_ECR_URL='689569268232.dkr.ecr.ap-south-1.amazonaws.com/k6-testing'

    }
    
    stages{

        stage('Pull Code from GitHub') {
            steps{
                git credentialsId: 'githubcred', url: 'https://github.com/srivishal1/CICD.git/'
            }
            }
            
         stage('Compile using Maven') {
            steps{
                 
                sh 'mvn -Dmaven.test.failure.ignore=true compile' 
            
            }
            }
            
//<<<<<<< HEAD
//          stage('Scan using Sonarqube') {
//                environment {
//                      scannerHome = tool 'sonarscanner'
//                  }
//             steps {
        
//              withSonarQubeEnv('Sonarqube') {
//                sh "${scannerHome}/bin/sonar-scanner"
//                 }
//              timeout(time: 2, unit: 'MINUTES') {
//                     retry(3) {
//                 script {
=======
//             stage('Scan using Sonarqube') {
//     environment {
//         scannerHome = tool 'sonarscanner'
//     }
//     steps {
        
//         withSonarQubeEnv('Sonarqube') {
//             sh "${scannerHome}/bin/sonar-scanner"
//         }
//         timeout(time: 2, unit: 'MINUTES') {
//                     retry(3) {
//           script {
//>>>>>>> 83369abeb1ba5388e7281fd2f3a1ed844429df7a
//                             def qg = waitForQualityGate()
//                             if (qg.status != 'OK') {
//                                 error "Pipeline aborted due to quality gate failure: ${qg.status}"
//                             }
//           }
//                     }
//         }
      
//     }
// }
            
            
            stage('Build Docker Image') {
            steps {
               withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'awscred', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    script {
                        docker.build("${AWS_ECR_URL}:${POM_VERSION}", "--build-arg JAR_FILE=${JAR_NAME} .")
                    }
                }
            }
        }
        
         stage('Push image to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'awscred', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    withAWS(region: "${AWS_ECR_REGION}") {
                        script {
                            def login = ecrLogin()
                            sh('#!/bin/sh -e\n' + "${login}") // hide logging
                            docker.image("${AWS_ECR_URL}:${POM_VERSION}").push()
                        }
                    }
                }
            }
        }

           
        stage('Deploy in ECS') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'awscred', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    script {
                        updateContainerDefinitionJsonWithImageVersion()
                       // sh("aws ecs register-task-definition --family ${AWS_ECS_TASK_DEFINITION} --cli-input-json file://${WORKSPACE}/${NAME}-v_${BUILD_NUMBER}.json --region ${REGION}")
                        sh("aws ecs register-task-definition --region ${AWS_ECR_REGION} --family ${AWS_ECS_TASK_DEFINITION}  --requires-compatibilities ${AWS_ECS_COMPATIBILITY} --network-mode ${AWS_ECS_NETWORK_MODE} --cpu ${AWS_ECS_CPU} --memory ${AWS_ECS_MEMORY} --cli-input-json file:///${WORKSPACE}/${AWS_ECS_TASK_DEFINITION_PATH}")
                       // def taskRevision = sh(script: "aws ecs describe-task-definition --task-definition ${AWS_ECS_TASK_DEFINITION} | egrep \"revision\" | tr \"/\" \" \" | awk '{print \$2}' | sed 's/\"\$//'", returnStdout: true)
                        SERVICES=sh(returnStdout: true,script:"aws ecs describe-services --services ${AWS_ECS_SERVICE} --cluster ${AWS_ECS_CLUSTER} --region ${AWS_ECR_REGION} | jq .failures[]")
                      echo "${SERVICES}"
                        def taskRevision = sh(script: "aws ecs describe-task-definition --task-definition ${AWS_ECS_TASK_DEFINITION} | egrep \"revision\" | tr \"/\" \" \" | awk '{print \$2}' | sed 's/\"\$//'", returnStdout: true)
                        if ("${SERVICES}" == "" ) {
                        echo "entered existing service"
                          def DESIRED_COUNT=sh(script:"aws ecs describe-services --services ${AWS_ECS_SERVICE} --cluster ${AWS_ECS_CLUSTER} --region ${AWS_ECR_REGION} | jq .services[].desiredCount")
                     sh(script:"aws ecs update-service --cluster ${AWS_ECS_CLUSTER} --service ${AWS_ECS_SERVICE} --task-definition ${AWS_ECS_TASK_DEFINITION}:${taskRevision}")
                         
                        if ( "${DESIRED_COUNT}" == "0" ) {
                            DESIRED_COUNT="1"
                         
                          sh(script:"aws ecs update-service --cluster ${AWS_ECS_CLUSTER} --service ${AWS_ECS_SERVICE} --task-definition ${AWS_ECS_TASK_DEFINITION}:${taskRevision}")
                          }
                        }
                    
                          else{
                   echo "entered new service"
            sh(script:"aws ecs create-service --network-configuration 'awsvpcConfiguration={subnets=[subnet-d45c5fbc],securityGroups=[sg-092631599958c083d]}' --service-name ${AWS_ECS_SERVICE} --desired-count 1  --cluster ${AWS_ECS_CLUSTER} --task-definition ${AWS_ECS_TASK_DEFINITION}:${taskRevision} ")
                          }
                       
                    }
                }
            }
        }
        }
}
         
        def getJarName() {
    def jarName = getName() + '-' + getVersion() + '.jar'
    echo "jarName: ${jarName}"
    return  jarName
}

def getVersion() {
    def pom = readMavenPom file: './pom.xml'
    return pom.version
}

def getName() {
    def pom = readMavenPom file: './pom.xml'
    return pom.name
}

def updateContainerDefinitionJsonWithImageVersion() {
    def containerDefinitionJson = readJSON file: AWS_ECS_TASK_DEFINITION_PATH, returnPojo: true
     echo "this is testing}"
     echo containerDefinitionJson['containerDefinitions'][0]['image']
    containerDefinitionJson['containerDefinitions'][0]['image'] = "${AWS_ECR_URL}:${POM_VERSION}".inspect()
    echo "task definiton json: ${containerDefinitionJson}"
    writeJSON file: AWS_ECS_TASK_DEFINITION_PATH, json: containerDefinitionJson
}

